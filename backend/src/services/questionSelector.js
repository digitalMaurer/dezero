import { AppError } from '../middleware/errorHandler.js';
import { getPreguntasConFiltro, ordenarPreguntas } from '../utils/filtroPreguntas.js';

// Validar que una pregunta tenga todos los campos requeridos
export const isPreguntaValid = (pregunta) => {
  return (
    pregunta &&
    pregunta.id &&
    pregunta.titulo &&
    pregunta.enunciado &&
    pregunta.opcionA &&
    pregunta.opcionB &&
    pregunta.opcionC &&
    pregunta.opcionD &&
    pregunta.respuestaCorrecta &&
    ['A', 'B', 'C', 'D'].includes(pregunta.respuestaCorrecta)
  );
};

const buildBaseWhere = ({ oposicionId, temasSeleccionados, dificultad }) => {
  const where = { status: 'PUBLISHED' };

  if (temasSeleccionados && temasSeleccionados.length > 0) {
    where.temaId = { in: temasSeleccionados };
  } else if (oposicionId) {
    where.tema = { oposicionId };
  }

  if (dificultad) {
    where.dificultad = dificultad;
  }

  return where;
};

const limitPreguntas = (preguntas, cantidad) => {
  if (!cantidad) return preguntas;
  const parsed = parseInt(cantidad);
  if (Number.isNaN(parsed) || parsed <= 0) return preguntas;
  return preguntas.slice(0, parsed);
};

const selectors = {
  MANICOMIO: async ({ prisma, oposicionId, temasSeleccionados, dificultad }) => {
    const where = buildBaseWhere({ oposicionId, temasSeleccionados, dificultad });
    const preguntas = await prisma.pregunta.findMany({ where });
    return preguntas.sort(() => Math.random() - 0.5);
  },
  FILTRADO: async ({ prisma, temasSeleccionados, filtroTipo, dificultad, filtroOrden, userId }) => {
    if (!filtroTipo) {
      throw new AppError('filtroTipo es requerido en modo FILTRADO', 400);
    }
    const preguntas = await getPreguntasConFiltro(temasSeleccionados, filtroTipo, dificultad, userId);
    return ordenarPreguntas(preguntas, filtroOrden);
  },
  ANKI: async ({ prisma, oposicionId, temasSeleccionados, dificultad }) => {
    const hoy = new Date();
    const where = {
      ...buildBaseWhere({ oposicionId, temasSeleccionados, dificultad }),
      OR: [{ dueDate: null }, { dueDate: { lte: hoy } }],
    };

    return prisma.pregunta.findMany({ where });
  },
  SIMULACRO_EXAMEN: async ({ prisma, temasSeleccionados, dificultad, cantidad }) => {
    if (!temasSeleccionados || temasSeleccionados.length === 0) {
      throw new AppError('Selecciona al menos un tema para el simulacro', 400);
    }

    const preguntasPorTema = await Promise.all(
      temasSeleccionados.map(async (tId) => {
        const where = {
          status: 'PUBLISHED',
          temaId: tId,
        };
        if (dificultad) where.dificultad = dificultad;
        const items = await prisma.pregunta.findMany({ where });
        return { temaId: tId, items: items.sort(() => Math.random() - 0.5) };
      })
    );

    const totalDisponibles = preguntasPorTema.reduce((sum, t) => sum + t.items.length, 0);
    let targetTotal = cantidad ? parseInt(cantidad) : 100;
    if (Number.isNaN(targetTotal) || targetTotal <= 0) targetTotal = 100;
    if (targetTotal > totalDisponibles) targetTotal = totalDisponibles;

    const n = preguntasPorTema.length;
    const base = Math.floor(targetTotal / n);
    let resto = targetTotal % n;
    const cupos = preguntasPorTema.map((t) => {
      const max = t.items.length;
      const cuota = Math.min(base + (resto > 0 ? 1 : 0), max);
      if (resto > 0) resto -= 1;
      return cuota;
    });

    const totalAsignadoInicial = cupos.reduce((a, b) => a + b, 0);
    let faltan = targetTotal - totalAsignadoInicial;
    let idx = 0;
    while (faltan > 0) {
      const i = idx % cupos.length;
      const capacidadExtra = preguntasPorTema[i].items.length - cupos[i];
      if (capacidadExtra > 0) {
        cupos[i] += 1;
        faltan -= 1;
      }
      idx += 1;
      if (idx > cupos.length * 2 && faltan > 0) break;
    }

    let preguntas = [];
    preguntasPorTema.forEach((t, i) => {
      const take = cupos[i];
      if (take > 0) {
        preguntas.push(...t.items.slice(0, take));
      }
    });

    return preguntas.sort(() => Math.random() - 0.5);
  },
  FAVORITOS: async ({ prisma, userId, temasSeleccionados, dificultad }) => {
    const where = {
      userId,
      pregunta: {
        status: 'PUBLISHED',
        ...(dificultad && { dificultad }),
        ...(temasSeleccionados && temasSeleccionados.length > 0 && {
          temaId: { in: temasSeleccionados },
        }),
      },
    };

    const favoritos = await prisma.favoritePregunta.findMany({
      where,
      include: { pregunta: true },
    });

    return favoritos.map((f) => f.pregunta).filter((p) => p !== null);
  },
  ALEATORIO: async ({ prisma, oposicionId, temasSeleccionados, dificultad }) => {
    const where = buildBaseWhere({ oposicionId, temasSeleccionados, dificultad });
    const preguntas = await prisma.pregunta.findMany({ where });
    return preguntas.sort(() => Math.random() - 0.5);
  },
};

export const selectQuestionsForAttempt = async ({
  prisma,
  mode = 'ALEATORIO',
  oposicionId,
  temasSeleccionados,
  cantidad,
  dificultad,
  filtroTipo,
  filtroOrden = 'ALEATORIO',
  userId,
}) => {
  const normalizedMode = mode || 'ALEATORIO';
  const selector = selectors[normalizedMode] || selectors.ALEATORIO;

  const preguntas = await selector({
    prisma,
    oposicionId,
    temasSeleccionados,
    cantidad,
    dificultad,
    filtroTipo,
    filtroOrden,
    userId,
  });

  const preguntasValidas = preguntas.filter(isPreguntaValid);
  if (preguntasValidas.length === 0) {
    throw new AppError('No hay preguntas disponibles con esos criterios', 404);
  }

  const limitadas = limitPreguntas(preguntasValidas, cantidad);
  if (limitadas.length === 0) {
    throw new AppError('No hay preguntas disponibles con esos criterios', 404);
  }

  return limitadas;
};
