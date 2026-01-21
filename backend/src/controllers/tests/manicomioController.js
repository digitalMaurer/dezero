import { PrismaClient } from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { shuffleQuestionOptions } from '../../utils/shuffleUtils.js';
import { isPreguntaValid } from '../../services/questionSelector.js';

const prisma = new PrismaClient();

// Responder pregunta en modo MANICOMIO (racha de 30 correctas)
export const answerQuestionManicomio = async (req, res, next) => {
  try {
    const { id } = req.params; // attemptId
    const { preguntaId, respuestaUsuario } = req.body;
    const userId = req.user.id;

    logger.debug('MANICOMIO answer payload', { attemptId: id, preguntaId, respuestaUsuario });

    if (!preguntaId || !respuestaUsuario) {
      throw new AppError('preguntaId y respuestaUsuario son requeridos', 400);
    }

    const attempt = await prisma.testAttempt.findFirst({
      where: { id, userId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                pregunta: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    if (attempt.tiempoFin) {
      throw new AppError('Este test ya ha finalizado', 400);
    }

    if (attempt.mode !== 'MANICOMIO') {
      throw new AppError('Este endpoint es solo para modo MANICOMIO', 400);
    }

    // En MANICOMIO, la pregunta debe estar en test.questions (se cargan todas al inicio)
    const testQuestion = attempt.test.questions.find(
      (q) => q.pregunta.id === preguntaId
    );

    if (!testQuestion) {
      throw new AppError('La pregunta no pertenece a este test', 400);
    }

    const pregunta = testQuestion.pregunta;

    // Validar que la pregunta esté completa
    if (!isPreguntaValid(pregunta)) {
      throw new AppError('La pregunta está incompleta', 400);
    }

    const existingResponse = await prisma.attemptResponse.findUnique({
      where: {
        attemptId_preguntaId: {
          attemptId: id,
          preguntaId,
        },
      },
    });

    // En MANICOMIO, permitimos reintentos sin restricciones
    // Si ya existe respuesta, simplemente la actualizaremos

    // Recalcular el shuffle con el mismo seed para obtener respuestaCorrecta remapeada
    const shuffled = shuffleQuestionOptions(pregunta);
    const respuestaCorrectaRemapeada = shuffled.respuestaCorrecta;
    const esCorrecta = respuestaCorrectaRemapeada === respuestaUsuario;

    logger.debug('[MANICOMIO] Validando respuesta', {
      preguntaId,
      respuestaUsuario,
      respuestaCorrectaOriginal: pregunta.respuestaCorrecta,
      respuestaCorrectaRemapeada,
      esCorrecta,
    });

    // Si ya había una respuesta previa, restarla antes de sumar la nueva
    const baseCorrectas = existingResponse
      ? Math.max(0, attempt.cantidadCorrectas - (existingResponse.esCorrecta ? 1 : 0))
      : attempt.cantidadCorrectas;
    const baseIncorrectas = existingResponse
      ? Math.max(0, attempt.cantidadIncorrectas - (existingResponse.esCorrecta ? 0 : 1))
      : attempt.cantidadIncorrectas;

    let streakCurrent = esCorrecta ? attempt.streakCurrent + 1 : 0;
    let streakMax = Math.max(streakCurrent, attempt.streakMax);
    let cantidadCorrectas = baseCorrectas + (esCorrecta ? 1 : 0);
    let cantidadIncorrectas = baseIncorrectas + (esCorrecta ? 0 : 1);
    let finished = false;
    let puntaje = attempt.puntaje;

    await prisma.$transaction(async (tx) => {
      if (existingResponse) {
        await tx.attemptResponse.update({
          where: {
            attemptId_preguntaId: {
              attemptId: id,
              preguntaId,
            },
          },
          data: {
            respuestaUsuario,
            esCorrecta,
          },
        });
      } else {
        await tx.attemptResponse.create({
          data: {
            attemptId: id,
            preguntaId,
            respuestaUsuario,
            esCorrecta,
          },
        });
      }

      // Actualizar estadísticas de pregunta
      const stats = await tx.questionStatistic.findUnique({
        where: { preguntaId },
      });

      if (stats) {
        await tx.questionStatistic.update({
          where: { preguntaId },
          data: {
            vecesRespondida: stats.vecesRespondida + 1,
            vecesCorrecta: stats.vecesCorrecta + (esCorrecta ? 1 : 0),
            porcentajeAcierto:
              ((stats.vecesCorrecta + (esCorrecta ? 1 : 0)) /
                (stats.vecesRespondida + 1)) *
              100,
          },
        });
      } else {
        await tx.questionStatistic.create({
          data: {
            preguntaId,
            vecesRespondida: 1,
            vecesCorrecta: esCorrecta ? 1 : 0,
            porcentajeAcierto: esCorrecta ? 100 : 0,
          },
        });
      }

      if (streakCurrent >= attempt.streakTarget) {
        finished = true;
        const totalRespondidas = cantidadCorrectas + cantidadIncorrectas;
        puntaje = Math.round((cantidadCorrectas / totalRespondidas) * 10);

        await tx.testAttempt.update({
          where: { id },
          data: {
            streakCurrent,
            streakMax,
            cantidadCorrectas,
            cantidadIncorrectas,
            puntaje,
            tiempoFin: new Date(),
          },
        });
      } else {
        await tx.testAttempt.update({
          where: { id },
          data: {
            streakCurrent,
            streakMax,
            cantidadCorrectas,
            cantidadIncorrectas,
          },
        });
      }
    });

    // Obtener los textos de las respuestas
    const opciones = [shuffled.opcionA, shuffled.opcionB, shuffled.opcionC, shuffled.opcionD];
    const textoRespuestaUsuario = opciones[respuestaUsuario.charCodeAt(0) - 65];
    const textoRespuestaCorrecta = opciones[respuestaCorrectaRemapeada.charCodeAt(0) - 65];

    res.json({
      success: true,
      data: {
        esCorrecta,
        respuestaCorrecta: respuestaCorrectaRemapeada,
        textoRespuestaUsuario,
        textoRespuestaCorrecta,
        preguntaActual: {
          id: pregunta.id,
          enunciado: pregunta.enunciado,
          tip: pregunta.tip,
          explicacion: pregunta.explicacion,
        },
        streakCurrent,
        streakMax,
        remaining: Math.max(attempt.streakTarget - streakCurrent, 0),
        finished,
        cantidadCorrectas,
        cantidadIncorrectas,
        puntaje: finished ? puntaje : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener siguiente pregunta en modo MANICOMIO
export const getNextManicomioQuestion = async (req, res, next) => {
  try {
    const { id } = req.params; // attemptId
    const userId = req.user.id;

    const attempt = await prisma.testAttempt.findFirst({
      where: { id, userId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                pregunta: {
                  include: {
                    tema: true, // Incluir tema para acceder a oposicionId
                  },
                },
              },
            },
          },
        },
        respuestas: true, // Para saber qué preguntas ya fueron respondidas
      },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    // Separar preguntas por estado
    const respondidas_correctas = attempt.respuestas
      .filter((resp) => resp.esCorrecta)
      .map((resp) => resp.preguntaId);

    const respondidas_incorrectas = attempt.respuestas
      .filter((resp) => !resp.esCorrecta)
      .map((resp) => resp.preguntaId);

    logger.info(`[MANICOMIO] Total: ${attempt.test.questions.length} preguntas, Correctas: ${respondidas_correctas.length}, Incorrectas: ${respondidas_incorrectas.length}`);

    // Usar TODAS las preguntas del test inicial (no ir a BD)
    const todasLasPreguntas = attempt.test.questions
      .map((q) => q.pregunta)
      .filter(isPreguntaValid);

    if (todasLasPreguntas.length === 0) {
      throw new AppError('No hay preguntas válidas en el test', 404);
    }

    // No respondidas = todas las del test - todas las respondidas (correctas o incorrectas)
    const no_respondidas = todasLasPreguntas.filter(
      (p) => !respondidas_correctas.includes(p.id) && !respondidas_incorrectas.includes(p.id)
    );

    // Incorrectas (para reintentar)
    const incorrectas = todasLasPreguntas.filter(
      (p) => respondidas_incorrectas.includes(p.id)
    );

    // Pool: priorizar no respondidas; solo usar incorrectas cuando no queden nuevas
    const pool = no_respondidas.length > 0 ? no_respondidas : incorrectas;
    const poolTipo = no_respondidas.length > 0 ? 'no_respondidas' : 'incorrectas';

    logger.info(`[MANICOMIO] Pool (${poolTipo}): ${pool.length} (no respondidas: ${no_respondidas.length}, incorrectas: ${incorrectas.length})`);

    if (pool.length === 0) {
      throw new AppError('No hay más preguntas disponibles', 404);
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    const selected = pool[randomIndex];
    
    logger.info(`[MANICOMIO] Seleccionada: índice ${randomIndex} de ${pool.length}, ID: ${selected.id}`);
    const shuffled = shuffleQuestionOptions(selected);
    const merged = {
      id: selected.id,
      titulo: selected.titulo,
      enunciado: selected.enunciado,
      tip: selected.tip,
      explicacion: selected.explicacion,
      opcionA: shuffled.opcionA,
      opcionB: shuffled.opcionB,
      opcionC: shuffled.opcionC,
      opcionD: shuffled.opcionD,
      respuestaCorrecta: shuffled.respuestaCorrecta,
      dificultad: selected.dificultad,
    };

    return res.json({
      success: true,
      data: merged,
    });
  } catch (error) {
    next(error);
  }
};
