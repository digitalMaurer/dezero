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
