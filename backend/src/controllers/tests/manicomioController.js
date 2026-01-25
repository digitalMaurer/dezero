import pkg from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { shuffleQuestionOptions } from '../../utils/shuffleUtils.js';
import { isPreguntaValid } from '../../services/questionSelector.js';
import { processAnswer } from '../../services/answerProcessor.js';
import { updateAnkiAttempt, updateManicomioAttempt } from '../../services/attemptUpdater.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Responder pregunta en modo MANICOMIO (racha de 30 correctas) o ANKI secuencial
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
        respuestas: true,
      },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    if (attempt.tiempoFin) {
      throw new AppError('Este test ya ha finalizado', 400);
    }

    const isManicomioMode = attempt.mode === 'MANICOMIO';
    const isAnkiMode = attempt.mode === 'ANKI';

    if (!isManicomioMode && !isAnkiMode) {
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

    // Preparar cola actual
    const attemptQueue = attempt.queue;
    let queue = Array.isArray(attemptQueue)
      ? [...attemptQueue]
      : (typeof attemptQueue === 'string' && attemptQueue.trim() !== ''
        ? (() => { try { return JSON.parse(attemptQueue); } catch (_) { return []; } })()
        : []);
    // Si sigue sin ser array (doble string), intentar parsear una vez más
    if (!Array.isArray(queue) && typeof queue === 'string') {
      try {
        queue = JSON.parse(queue);
      } catch (_) {
        queue = [];
      }
    }
    if (!Array.isArray(queue)) queue = [];
    let cursor = attempt.queueCursor || 0;

    // En MANICOMIO, permitimos reintentos sin restricciones
    // Si ya existe respuesta, simplemente la actualizaremos

    const {
      esCorrecta,
      respuestaCorrectaRemapeada,
      textoRespuestaUsuario,
      textoRespuestaCorrecta,
      baseCorrectas,
      baseIncorrectas,
    } = processAnswer({
      attempt,
      pregunta,
      respuestaUsuario,
      existingResponse,
    });

    logger.debug('[MANICOMIO] Validando respuesta', {
      preguntaId,
      respuestaUsuario,
      respuestaCorrectaOriginal: pregunta.respuestaCorrecta,
      respuestaCorrectaRemapeada,
      esCorrecta,
    });

    let streakCurrent = esCorrecta ? attempt.streakCurrent + 1 : 0;
    let streakMax = Math.max(streakCurrent, attempt.streakMax);
    let cantidadCorrectas = baseCorrectas + (esCorrecta ? 1 : 0);
    let cantidadIncorrectas = baseIncorrectas + (esCorrecta ? 0 : 1);
    let finished = false;
    let puntaje = attempt.puntaje;
    let totalRespondidas = attempt.respuestas?.length || 0;

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

      // Calcular total de respondidas después de registrar la respuesta
      totalRespondidas = await tx.attemptResponse.count({ where: { attemptId: id } });

      // Reordenar cola: mover la pregunta actual al final
      if (isManicomioMode) {
        const idx = queue.findIndex((qId) => qId === preguntaId);
        if (idx >= 0) {
          queue.splice(idx, 1);
          if (idx < cursor) {
            cursor = Math.max(0, cursor - 1);
          }
        }
        queue.push(preguntaId);
        if (cursor >= queue.length) {
          cursor = cursor % queue.length;
        }

        // Log para diagnosticar orden y estado de la cola
        logger.debug('[MANICOMIO] Cola tras responder', {
          attemptId: id,
          queueLength: queue.length,
          cursor,
          first10: queue.slice(0, 10),
        });
      }

      if (isManicomioMode) {
        const result = await updateManicomioAttempt({
          tx,
          attemptId: id,
          streakCurrent,
          streakMax,
          cantidadCorrectas,
          cantidadIncorrectas,
          streakTarget: attempt.streakTarget,
          queue,
          queueCursor: cursor,
        });
        finished = result.finished;
        puntaje = result.puntaje ?? puntaje;
      } else {
        const totalPreguntas = attempt.test.questions.length;
        const result = await updateAnkiAttempt({
          tx,
          attemptId: id,
          cantidadCorrectas,
          cantidadIncorrectas,
          streakCurrent,
          streakMax,
          totalRespondidas,
          totalPreguntas,
        });
        finished = result.finished;
        puntaje = result.puntaje ?? puntaje;
      }
    });

    res.json({
      success: true,
      data: {
        esCorrecta,
        respuestaUsuario,
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
        remaining: isManicomioMode
          ? Math.max(attempt.streakTarget - streakCurrent, 0)
          : Math.max((attempt.test.questions.length || 0) - totalRespondidas, 0),
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

    // Cola persistida: tomar la siguiente pregunta según queue/queueCursor
    const attemptQueue = attempt.queue;
    let queue = Array.isArray(attemptQueue)
      ? [...attemptQueue]
      : (typeof attemptQueue === 'string' && attemptQueue.trim() !== ''
        ? (() => { try { return JSON.parse(attemptQueue); } catch (_) { return []; } })()
        : []);
    const allQuestionsMap = new Map(
      (attempt.test.questions || []).map((q) => [q.pregunta.id, q.pregunta])
    );

    if (queue.length === 0) {
      // Fallback: construir cola con preguntas válidas y barajar
      queue = (attempt.test.questions || [])
        .map((q) => q.pregunta)
        .filter(isPreguntaValid)
        .map((p) => p.id);
      if (queue.length === 0) {
        throw new AppError('No hay preguntas válidas en el test', 404);
      }
      await prisma.testAttempt.update({
        where: { id },
        data: { queue: JSON.stringify(queue), queueCursor: 0 },
      });
    }

    let cursor = attempt.queueCursor || 0;
    let selected = null;
    let attemptsLeft = queue.length;

    while (attemptsLeft > 0 && queue.length > 0) {
      if (cursor >= queue.length) cursor = 0;
      const targetId = queue[cursor];
      const candidate = allQuestionsMap.get(targetId);

      if (candidate && isPreguntaValid(candidate)) {
        selected = candidate;
        cursor = (cursor + 1) % queue.length;
        break;
      }

      // Si no es válida, eliminarla de la cola y continuar
      queue.splice(cursor, 1);
      attemptsLeft -= 1;
    }

    if (!selected) {
      throw new AppError('No hay preguntas válidas en el test', 404);
    }

    // Persistir cursor/cola actualizada (si cambió la longitud)
    await prisma.testAttempt.update({
      where: { id },
      data: {
        queue: JSON.stringify(queue),
        queueCursor: cursor,
      },
    });

    logger.info(`[MANICOMIO] Seleccionada desde cola. Cursor: ${cursor}/${queue.length}, ID: ${selected.id}`);
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
