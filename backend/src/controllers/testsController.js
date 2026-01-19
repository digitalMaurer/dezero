import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Crear un intento de test
export const createTestAttempt = async (req, res, next) => {
  try {
    const { oposicionId, temaId, temaIds, cantidad = 10, dificultad } = req.body;
    const userId = req.user.id;

    if (!oposicionId) {
      throw new AppError('oposicionId es requerido', 400);
    }

    // Construir filtro para preguntas
    const where = {
      status: 'PUBLISHED',
    };

    // Aceptar temaId (singular) o temaIds (array)
    const temasSeleccionados = temaIds && Array.isArray(temaIds) ? temaIds : (temaId ? [temaId] : null);

    if (temasSeleccionados && temasSeleccionados.length > 0) {
      where.temaId = {
        in: temasSeleccionados,
      };
    } else {
      // Si no hay tema específico, buscar por oposición
      where.tema = {
        oposicionId,
      };
    }

    if (dificultad) {
      where.dificultad = dificultad;
    }

    // Obtener preguntas aleatorias
    const preguntas = await prisma.pregunta.findMany({
      where,
      take: parseInt(cantidad),
    });

    if (preguntas.length === 0) {
      throw new AppError('No hay preguntas disponibles con esos criterios', 404);
    }

    // Mezclar preguntas
    const preguntasMezcladas = preguntas.sort(() => Math.random() - 0.5);

    // Crear el test
    const test = await prisma.test.create({
      data: {
        nombre: `Test ${new Date().toLocaleDateString()}`,
        cantidadPreguntas: preguntasMezcladas.length,
        questions: {
          create: preguntasMezcladas.map((p, index) => ({
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
