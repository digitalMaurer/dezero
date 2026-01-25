import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

/**
 * Aplica filtros avanzados a las preguntas según el tipo de filtro
 * @param {Array} temaIds - IDs de temas
 * @param {string} filtroTipo - Tipo de filtro a aplicar
 * @param {string} dificultad - Dificultad (opcional)
 * @param {string} userId - ID del usuario (para filtros personalizados)
 * @returns {Promise<Array>} Preguntas filtradas
 */
export async function getPreguntasConFiltro(temaIds, filtroTipo, dificultad, userId) {
  const baseWhere = {
    status: 'PUBLISHED',
  };

  if (temaIds && temaIds.length > 0) {
    baseWhere.temaId = { in: temaIds };
  }

  if (dificultad) {
    baseWhere.dificultad = dificultad;
  }

  let preguntas = [];

  switch (filtroTipo) {
    case 'MAS_ERRONEAS':
      // Preguntas con más respuestas incorrectas del usuario
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          statistics: true,
          testQuestions: {
            include: {
              test: {
                include: {
                  attempts: {
                    where: { userId },
                    include: {
                      respuestas: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Calcular errores por pregunta
      preguntas = preguntas.map((p) => {
        let errores = 0;
        p.testQuestions.forEach((tq) => {
          tq.test.attempts.forEach((attempt) => {
            const respuesta = attempt.respuestas.find((r) => r.preguntaId === p.id);
            if (respuesta && !respuesta.esCorrecta) {
              errores++;
            }
          });
        });
        return { ...p, errorCount: errores };
      });

      // Ordenar por errores (más errores primero)
      preguntas.sort((a, b) => b.errorCount - a.errorCount);
      break;

    case 'ULTIMA_ERRONEA':
      // Solo preguntas cuya última respuesta fue incorrecta
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          testQuestions: {
            include: {
              test: {
                include: {
                  attempts: {
                    where: { userId },
                    include: {
                      respuestas: true,
                    },
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          },
        },
      });

      // Filtrar solo las que la última respuesta fue incorrecta
      preguntas = preguntas.filter((p) => {
        let ultimaRespuesta = null;
        let fechaMasReciente = null;

        p.testQuestions.forEach((tq) => {
          tq.test.attempts.forEach((attempt) => {
            const respuesta = attempt.respuestas.find((r) => r.preguntaId === p.id);
            if (respuesta) {
              const fechaRespuesta = new Date(respuesta.createdAt);
              if (!fechaMasReciente || fechaRespuesta > fechaMasReciente) {
                fechaMasReciente = fechaRespuesta;
                ultimaRespuesta = respuesta;
              }
            }
          });
        });

        return ultimaRespuesta && !ultimaRespuesta.esCorrecta;
      });
      break;

    case 'NUNCA_RESPONDIDAS':
      // Preguntas que nunca han sido respondidas por el usuario
      const preguntasRespondidas = await prisma.attemptResponse.findMany({
        where: {
          attempt: { userId },
        },
        select: { preguntaId: true },
        distinct: ['preguntaId'],
      });

      const idsRespondidas = preguntasRespondidas.map((r) => r.preguntaId);

      preguntas = await prisma.pregunta.findMany({
        where: {
          ...baseWhere,
          id: {
            notIn: idsRespondidas,
          },
        },
      });
      break;

    case 'PEOR_PORCENTAJE':
      // Preguntas con peor porcentaje de acierto del usuario
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          testQuestions: {
            include: {
              test: {
                include: {
                  attempts: {
                    where: { userId },
                    include: {
                      respuestas: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Calcular porcentaje de acierto
      preguntas = preguntas
        .map((p) => {
          let total = 0;
          let correctas = 0;

          p.testQuestions.forEach((tq) => {
            tq.test.attempts.forEach((attempt) => {
              const respuesta = attempt.respuestas.find((r) => r.preguntaId === p.id);
              if (respuesta) {
                total++;
                if (respuesta.esCorrecta) correctas++;
              }
            });
          });

          const porcentaje = total > 0 ? (correctas / total) * 100 : 100;
          return { ...p, porcentajeAcierto: porcentaje, totalRespuestas: total };
        })
        .filter((p) => p.totalRespuestas > 0) // Solo las que han sido respondidas
        .sort((a, b) => a.porcentajeAcierto - b.porcentajeAcierto);
      break;

    case 'MAS_RESPONDIDAS':
      // Preguntas más veces respondidas
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          statistics: true,
        },
      });

      preguntas.sort((a, b) => (b.statistics?.vecesRespondida || 0) - (a.statistics?.vecesRespondida || 0));
      break;

    case 'MENOS_RESPONDIDAS':
      // Preguntas menos veces respondidas
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          statistics: true,
        },
      });

      preguntas.sort((a, b) => (a.statistics?.vecesRespondida || 0) - (b.statistics?.vecesRespondida || 0));
      break;

    case 'SOLO_INCORRECTAS':
      // Preguntas respondidas incorrectamente al menos una vez
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
        include: {
          testQuestions: {
            include: {
              test: {
                include: {
                  attempts: {
                    where: { userId },
                    include: {
                      respuestas: {
                        where: { esCorrecta: false },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Filtrar solo las que tienen al menos una respuesta incorrecta
      preguntas = preguntas.filter((p) => {
        return p.testQuestions.some((tq) =>
          tq.test.attempts.some((attempt) => attempt.respuestas.length > 0)
        );
      });
      break;

    case 'REVISION_PENDIENTE':
      // Preguntas con revisión pendiente según Anki (dueDate <= hoy o null)
      const hoy = new Date();
      preguntas = await prisma.pregunta.findMany({
        where: {
          ...baseWhere,
          OR: [
            { dueDate: null },
            { dueDate: { lte: hoy } },
          ],
        },
      });
      break;

    default:
      // Sin filtro específico, todas las preguntas
      preguntas = await prisma.pregunta.findMany({
        where: baseWhere,
      });
      break;
  }

  return preguntas;
}

/**
 * Ordena las preguntas según el criterio especificado
 * @param {Array} preguntas - Array de preguntas
 * @param {string} orden - Tipo de orden
 * @returns {Array} Preguntas ordenadas
 */
export function ordenarPreguntas(preguntas, orden) {
  const dificultadOrder = { EASY: 1, MEDIUM: 2, HARD: 3, ULTRAHARD: 4 };

  switch (orden) {
    case 'DIFICULTAD_ASC':
      return preguntas.sort((a, b) => dificultadOrder[a.dificultad] - dificultadOrder[b.dificultad]);

    case 'DIFICULTAD_DESC':
      return preguntas.sort((a, b) => dificultadOrder[b.dificultad] - dificultadOrder[a.dificultad]);

    case 'MAS_ERRORES':
      // Ya debe venir con errorCount si se usó ese filtro
      return preguntas.sort((a, b) => (b.errorCount || 0) - (a.errorCount || 0));

    case 'MENOS_ERRORES':
      return preguntas.sort((a, b) => (a.errorCount || 0) - (b.errorCount || 0));

    case 'ALEATORIO':
    default:
      return preguntas.sort(() => Math.random() - 0.5);
  }
}
