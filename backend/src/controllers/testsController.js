import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { getPreguntasConFiltro, ordenarPreguntas } from '../utils/filtroPreguntas.js';

const prisma = new PrismaClient();

// Crear un intento de test
export const createTestAttempt = async (req, res, next) => {
  try {
    const { 
      oposicionId, 
      temaId, 
      temaIds, 
      cantidad = 10, 
      dificultad,
      mode = 'ALEATORIO',
      filtroTipo,
      filtroOrden = 'ALEATORIO'
    } = req.body;
    const userId = req.user.id;

    if (!oposicionId) {
      throw new AppError('oposicionId es requerido', 400);
    }

    // Aceptar temaId (singular) o temaIds (array)
    const temasSeleccionados = temaIds && Array.isArray(temaIds) ? temaIds : (temaId ? [temaId] : null);

    let preguntas = [];

    // Según el modo, obtener preguntas de diferente forma
    if (mode === 'FILTRADO' && filtroTipo) {
      // Modo filtrado: usar filtros avanzados
      preguntas = await getPreguntasConFiltro(temasSeleccionados, filtroTipo, dificultad, userId);
      preguntas = ordenarPreguntas(preguntas, filtroOrden);
    } else if (mode === 'ANKI') {
      // Modo Anki: solo preguntas vencidas
      const hoy = new Date();
      const where = {
        status: 'PUBLISHED',
        OR: [
          { dueDate: null },
          { dueDate: { lte: hoy } },
        ],
      };

      if (temasSeleccionados && temasSeleccionados.length > 0) {
        where.temaId = { in: temasSeleccionados };
      } else {
        where.tema = { oposicionId };
      }

      if (dificultad) {
        where.dificultad = dificultad;
      }

      preguntas = await prisma.pregunta.findMany({ where });
    } else if (mode === 'REPASO') {
      // Modo repaso: preguntas con estadísticas bajas
      const where = {
        status: 'PUBLISHED',
      };

      if (temasSeleccionados && temasSeleccionados.length > 0) {
        where.temaId = { in: temasSeleccionados };
      } else {
        where.tema = { oposicionId };
      }

      if (dificultad) {
        where.dificultad = dificultad;
      }

      preguntas = await prisma.pregunta.findMany({
        where,
        include: {
          statistics: true,
        },
      });

      // Filtrar las que tienen bajo porcentaje de acierto o nunca respondidas
      preguntas = preguntas.filter((p) => {
        const stats = p.statistics;
        return !stats || stats.vecesRespondida === 0 || stats.porcentajeAcierto < 70;
      });
    } else {
      // Modo aleatorio (default)
      const where = {
        status: 'PUBLISHED',
      };

      if (temasSeleccionados && temasSeleccionados.length > 0) {
        where.temaId = { in: temasSeleccionados };
      } else {
        where.tema = { oposicionId };
      }

      if (dificultad) {
        where.dificultad = dificultad;
      }

      preguntas = await prisma.pregunta.findMany({ where });
      // Mezclar aleatoriamente
      preguntas = preguntas.sort(() => Math.random() - 0.5);
    }

    if (preguntas.length === 0) {
      throw new AppError('No hay preguntas disponibles con esos criterios', 404);
    }

    // Limitar a la cantidad solicitada
    const preguntasSeleccionadas = preguntas.slice(0, parseInt(cantidad));

    // Crear el test
    const test = await prisma.test.create({
      data: {
        nombre: `Test ${mode} - ${new Date().toLocaleDateString()}`,
        cantidadPreguntas: preguntasSeleccionadas.length,
        questions: {
          create: preguntasSeleccionadas.map((p, index) => ({
            preguntaId: p.id,
            orden: index + 1,
          })),
        },
      },
      include: {
        questions: {
          include: {
            pregunta: true,
          },
        },
      },
    });

    // Crear el intento
    const attempt = await prisma.testAttempt.create({
      data: {
        testId: test.id,
        oposicionId,
        userId,
        puntaje: 0,
        cantidadCorrectas: 0,
        cantidadIncorrectas: 0,
        mode,
        streakCurrent: 0,
        streakMax: 0,
        tiempoInicio: new Date(),
      },
    });

    // Devolver preguntas sin respuestas
    const preguntasParaTest = test.questions.map((q) => ({
      id: q.pregunta.id,
      titulo: q.pregunta.titulo,
      enunciado: q.pregunta.enunciado,
      opcionA: q.pregunta.opcionA,
      opcionB: q.pregunta.opcionB,
      opcionC: q.pregunta.opcionC,
      opcionD: q.pregunta.opcionD,
      dificultad: q.pregunta.dificultad,
      orden: q.orden,
    }));

    logger.info(`✅ Test attempt creado: ${attempt.id} para usuario ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Test iniciado',
      data: {
        attemptId: attempt.id,
        testId: test.id,
        preguntas: preguntasParaTest,
        mode,
        tiempoInicio: attempt.tiempoInicio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Enviar respuestas y corregir test
export const submitTestAttempt = async (req, res, next) => {
  try {
    const { attemptId, respuestas } = req.body;
    const userId = req.user.id;

    if (!attemptId || !respuestas || !Array.isArray(respuestas)) {
      throw new AppError('attemptId y respuestas son requeridos', 400);
    }

    // Verificar que el attempt existe y pertenece al usuario
    const attempt = await prisma.testAttempt.findFirst({
      where: {
        id: attemptId,
        userId,
      },
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
      throw new AppError('Este test ya ha sido completado', 400);
    }

    // Corregir respuestas
    let correctas = 0;
    let incorrectas = 0;
    const respuestasCorregidas = [];

    for (const respuesta of respuestas) {
      const pregunta = attempt.test.questions.find(
        (q) => q.pregunta.id === respuesta.preguntaId
      );

      if (!pregunta) {
        continue;
      }

      const esCorrecta =
        pregunta.pregunta.respuestaCorrecta === respuesta.respuestaUsuario;

      if (esCorrecta) {
        correctas++;
      } else {
        incorrectas++;
      }

      respuestasCorregidas.push({
        preguntaId: respuesta.preguntaId,
        respuestaUsuario: respuesta.respuestaUsuario,
        respuestaCorrecta: pregunta.pregunta.respuestaCorrecta,
        esCorrecta,
        explicacion: pregunta.pregunta.explicacion,
        titulo: pregunta.pregunta.titulo,
        enunciado: pregunta.pregunta.enunciado,
      });

      // Crear registro de respuesta
      await prisma.attemptResponse.create({
        data: {
          attemptId,
          preguntaId: respuesta.preguntaId,
          respuestaUsuario: respuesta.respuestaUsuario,
          esCorrecta,
        },
      });

      // Actualizar estadísticas de pregunta
      const stats = await prisma.questionStatistic.findUnique({
        where: { preguntaId: respuesta.preguntaId },
      });

      if (stats) {
        await prisma.questionStatistic.update({
          where: { preguntaId: respuesta.preguntaId },
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
        await prisma.questionStatistic.create({
          data: {
            preguntaId: respuesta.preguntaId,
            vecesRespondida: 1,
            vecesCorrecta: esCorrecta ? 1 : 0,
            porcentajeAcierto: esCorrecta ? 100 : 0,
          },
        });
      }
    }

    // Calcular puntaje (sobre 10)
    const puntaje = Math.round((correctas / attempt.test.cantidadPreguntas) * 10);

    // Actualizar el attempt
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        tiempoFin: new Date(),
        puntaje,
        cantidadCorrectas: correctas,
        cantidadIncorrectas: incorrectas,
      },
    });

    logger.info(`✅ Test completado: ${attemptId} - Puntaje: ${puntaje}/10`);

    res.json({
      success: true,
      message: 'Test completado y corregido',
      data: {
        puntaje,
        cantidadCorrectas: correctas,
        cantidadIncorrectas: incorrectas,
        totalPreguntas: attempt.test.cantidadPreguntas,
        porcentajeAcierto: Math.round((correctas / attempt.test.cantidadPreguntas) * 100),
        respuestas: respuestasCorregidas,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Responder pregunta en modo MANICOMIO (racha de 30 correctas)
export const answerQuestionManicomio = async (req, res, next) => {
  try {
    const { id } = req.params; // attemptId
    const { preguntaId, respuestaUsuario } = req.body;
    const userId = req.user.id;

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

    const question = attempt.test.questions.find(
      (q) => q.pregunta.id === preguntaId
    );

    if (!question) {
      throw new AppError('La pregunta no pertenece a este test', 400);
    }

    const existingResponse = await prisma.attemptResponse.findUnique({
      where: {
        attemptId_preguntaId: {
          attemptId: id,
          preguntaId,
        },
      },
    });

    if (existingResponse) {
      throw new AppError('Esta pregunta ya fue respondida en este intento', 400);
    }

    const esCorrecta = question.pregunta.respuestaCorrecta === respuestaUsuario;

    let streakCurrent = esCorrecta ? attempt.streakCurrent + 1 : 0;
    let streakMax = Math.max(streakCurrent, attempt.streakMax);
    let cantidadCorrectas = attempt.cantidadCorrectas + (esCorrecta ? 1 : 0);
    let cantidadIncorrectas = attempt.cantidadIncorrectas + (esCorrecta ? 0 : 1);
    let finished = false;
    let puntaje = attempt.puntaje;

    await prisma.$transaction(async (tx) => {
      await tx.attemptResponse.create({
        data: {
          attemptId: id,
          preguntaId,
          respuestaUsuario,
          esCorrecta,
        },
      });

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

      if (streakCurrent >= 30) {
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

    res.json({
      success: true,
      data: {
        esCorrecta,
        streakCurrent,
        streakMax,
        remaining: Math.max(30 - streakCurrent, 0),
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

// Eliminar un intento de test en curso
export const deleteTestAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attempt = await prisma.testAttempt.findFirst({
      where: { id, userId },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    // Eliminar respuestas asociadas y el intento
    await prisma.testAttempt.delete({
      where: { id },
    });

    logger.info(`✅ Test attempt eliminado: ${id}`);

    res.json({
      success: true,
      message: 'Test eliminado correctamente',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Intento de test no encontrado', 404));
    }
    next(error);
  }
};

// Obtener resultado de un intento
export const getTestAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attempt = await prisma.testAttempt.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                pregunta: true,
              },
              orderBy: {
                orden: 'asc',
              },
            },
          },
        },
        respuestas: true,
        oposicion: true,
      },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    res.json({
      success: true,
      data: { attempt },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener historial de tests del usuario
export const getUserTestHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { userId },
        include: {
          oposicion: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          test: {
            select: {
              nombre: true,
              cantidadPreguntas: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.testAttempt.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: {
        attempts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas del usuario
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        tiempoFin: { not: null },
      },
      select: {
        puntaje: true,
        cantidadCorrectas: true,
        cantidadIncorrectas: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (attempts.length === 0) {
      return res.json({
        success: true,
        data: {
          totalTests: 0,
          promedioGeneral: 0,
          mejorPuntaje: 0,
          peorPuntaje: 0,
          tendencia: [],
        },
      });
    }

    const totalTests = attempts.length;
    const promedioGeneral =
      attempts.reduce((sum, a) => sum + a.puntaje, 0) / totalTests;
    const mejorPuntaje = Math.max(...attempts.map((a) => a.puntaje));
    const peorPuntaje = Math.min(...attempts.map((a) => a.puntaje));

    res.json({
      success: true,
      data: {
        totalTests,
        promedioGeneral: Math.round(promedioGeneral * 10) / 10,
        mejorPuntaje,
        peorPuntaje,
        tendencia: attempts.slice(0, 10).reverse(),
      },
    });
  } catch (error) {
    next(error);
  }
};
