import { AppError } from '../middleware/errorHandler.js';

// Stopwords específicas a ignorar en comparación de enunciados
const EXTRA_STOPWORDS = new Set([
  'segun', 'según', 'incorrecta', 'incorrecto', 'ley', 'temario',
]);

// Stopwords comunes en español (minimalista para no meter dependencia extra)
const BASE_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'y', 'o', 'u',
  'que', 'en', 'con', 'por', 'para', 'se', 'su', 'sus', 'es', 'son', 'ser', 'esta', 'este',
  'esto', 'estas', 'estos', 'como', 'más', 'menos', 'muy', 'sin', 'sobre', 'entre', 'ya',
  'no', 'sí', 'si', 'también', 'pero', 'cuando', 'donde', 'cual', 'cuales', 'cualquiera',
]);

const STOPWORDS = new Set([...BASE_STOPWORDS, ...EXTRA_STOPWORDS]);

const tokenize = (text = '') => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9áéíóúñü\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
};

const jaccardSimilarity = (aTokens, bTokens) => {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  const intersection = [...aSet].filter((x) => bSet.has(x)).length;
  const union = new Set([...aSet, ...bSet]).size || 1;
  return intersection / union;
};

const scorePreguntaPair = (pA, pB) => {
  const tokensA = tokenize(`${pA.titulo || ''} ${pA.enunciado || ''}`);
  const tokensB = tokenize(`${pB.titulo || ''} ${pB.enunciado || ''}`);
  return jaccardSimilarity(tokensA, tokensB);
};

export const findSimilarQuestions = async ({ prisma, preguntaId, threshold = 0.4, limit = 20 }) => {
  const base = await prisma.pregunta.findUnique({ where: { id: preguntaId } });
  if (!base) {
    throw new AppError('Pregunta no encontrada', 404);
  }

  // Fetch false positives for this base to excluir pares ya descartados
  const fpairs = await prisma.duplicateFalsePositive.findMany({
    where: {
      OR: [{ preguntaAId: preguntaId }, { preguntaBId: preguntaId }],
    },
  });
  const fpSet = new Set(
    fpairs.map((p) => {
      const a = [p.preguntaAId, p.preguntaBId].sort();
      return a.join('|');
    })
  );

  // Buscar en mismo tema; si no hay, ampliar a misma oposición mediante join tema
  const where = base.temaId
    ? { temaId: base.temaId }
    : {};

  const candidates = await prisma.pregunta.findMany({
    where,
    include: {
      tema: true,
    },
    take: 1000,
  });

  const scored = candidates
    .filter((p) => p.id !== base.id)
    .map((p) => ({
      pregunta: p,
      score: scorePreguntaPair(base, p),
    }))
    // Filtrar false positives previamente marcados
    .filter((item) => {
      const pair = [preguntaId, item.pregunta.id].sort().join('|');
      return !fpSet.has(pair);
    })
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { base, similar: scored };
};

// Escaneo por tema (o global) sin pregunta base: devuelve pares con score >= threshold
export const scanSimilarQuestions = async ({ prisma, temaId = null, threshold = 0.4, limit = 200, maxCandidates = 300 }) => {
  const where = temaId
    ? { temaId, duplicateStatus: 'ACTIVE' }
    : { duplicateStatus: 'ACTIVE' };

  const candidates = await prisma.pregunta.findMany({
    where,
    include: { tema: true },
    take: maxCandidates,
    orderBy: { createdAt: 'desc' },
  });

  if (candidates.length === 0) {
    return [];
  }

  // Pre-cargar falsos positivos para estos IDs
  const ids = candidates.map((c) => c.id);
  const fpairs = prisma.duplicateFalsePositive
    ? await prisma.duplicateFalsePositive.findMany({
        where: {
          OR: [{ preguntaAId: { in: ids } }, { preguntaBId: { in: ids } }],
        },
      })
    : [];
  const fpSet = new Set(
    fpairs.map((p) => {
      const a = [p.preguntaAId, p.preguntaBId].sort();
      return a.join('|');
    })
  );

  // Tokenizar una vez por pregunta
  const tokenMap = new Map();
  candidates.forEach((p) => {
    tokenMap.set(p.id, tokenize(`${p.titulo || ''} ${p.enunciado || ''}`));
  });

  const pairs = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const a = candidates[i];
    const tokensA = tokenMap.get(a.id) || [];
    for (let j = i + 1; j < candidates.length; j += 1) {
      const b = candidates[j];
      const pairKey = [a.id, b.id].sort().join('|');
      if (fpSet.has(pairKey)) continue;

      const tokensB = tokenMap.get(b.id) || [];
      const score = jaccardSimilarity(tokensA, tokensB);
      if (score >= threshold) {
        pairs.push({
          a,
          b,
          score,
        });
      }
    }
  }

  // Agrupar pares por pregunta base: cada pregunta que aparece se convierte en un grupo
  const groupMap = new Map();
  
  pairs.forEach(({ a, b, score }) => {
    // Agregar b como similar de a
    if (!groupMap.has(a.id)) {
      groupMap.set(a.id, { base: a, similar: [] });
    }
    groupMap.get(a.id).similar.push({ pregunta: b, score });

    // Agregar a como similar de b
    if (!groupMap.has(b.id)) {
      groupMap.set(b.id, { base: b, similar: [] });
    }
    groupMap.get(b.id).similar.push({ pregunta: a, score });
  });

  // Convertir a array, ordenar similar por score descendente en cada grupo, limitar grupos
  const groups = Array.from(groupMap.values())
    .map((group) => ({
      ...group,
      similar: group.similar.sort((x, y) => y.score - x.score),
    }))
    .sort((x, y) => y.similar.length - x.similar.length)
    .slice(0, limit);

  return groups;
};
