import pkg from '@prisma/client';
import { AppError } from '../../middleware/errorHandler.js';
import { logger } from '../../utils/logger.js';
import { shuffleQuestionOptions } from '../../utils/shuffleUtils.js';
import { selectQuestionsForAttempt } from '../../services/questionSelector.js';
import { shuffleArray } from '../../utils/shuffleUtils.js';
import { generateTestPDF } from '../../services/pdfGenerator.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Crear un intento de test
export const createTestAttempt = async (req, res, next) => {
  try {
    const { 
      oposicionId, 
      temaId, 
      temaIds, 
      cantidad,  // Sin default para permitir undefined/null
      dificultad,
      mode = 'ALEATORIO',
      filtroTipo,
      filtroOrden = 'ALEATORIO',
      streakTarget = 30,  // Para modo Manicomio
      ankiScope = 'PENDIENTES'
    } = req.body;
    const userId = req.user.id;

    if (!oposicionId) {
      throw new AppError('oposicionId es requerido', 400);
    }

    // Aceptar temaId (singular) o temaIds (array)
    const temasSeleccionados = temaIds && Array.isArray(temaIds) ? temaIds : (temaId ? [temaId] : null);

    const preguntasSeleccionadas = await selectQuestionsForAttempt({
      prisma,
      mode,
      oposicionId,
      temasSeleccionados,
      cantidad,
      dificultad,
      filtroTipo,
      filtroOrden,
      userId,
      ankiScope,
    });

    // Cola inicial para MANICOMIO: barajar las preguntas para evitar orden repetitivo
    const initialQueue = mode === 'MANICOMIO'
      ? shuffleArray(preguntasSeleccionadas.map((p) => p.id))
      : [];

    // Crear el test
    const { test, attempt } = await prisma.$transaction(async (tx) => {
      const testCreated = await tx.test.create({
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
            orderBy: {
              orden: 'asc',
            },
          },
        },
      });

      const attemptCreated = await tx.testAttempt.create({
        data: {
          testId: testCreated.id,
          oposicionId,
          userId,
          puntaje: 0,
          cantidadCorrectas: 0,
          cantidadIncorrectas: 0,
          mode,
          streakCurrent: 0,
          streakMax: 0,
          streakTarget: mode === 'MANICOMIO' ? streakTarget : 30, // Usar streakTarget en Manicomio
          tiempoInicio: new Date(),
          queue: mode === 'MANICOMIO' ? JSON.stringify(initialQueue) : null,
          queueCursor: 0,
        },
      });

      return { test: testCreated, attempt: attemptCreated };
    });

    // Devolver preguntas sin respuestas (con opciones mezcladas)
    // IMPORTANTE: NO incluir respuestaCorrecta por seguridad
    const preguntasParaTest = test.questions.map((q) => {
      const shuffled = shuffleQuestionOptions(q.pregunta);
      return {
        id: q.pregunta.id,
        titulo: q.pregunta.titulo,
        enunciado: q.pregunta.enunciado,
        opcionA: shuffled.opcionA,
        opcionB: shuffled.opcionB,
        opcionC: shuffled.opcionC,
        opcionD: shuffled.opcionD,
        dificultad: shuffled.dificultad,
        orden: q.orden,
      };
    });

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
        streakTarget: attempt.streakTarget,
        streakCurrent: attempt.streakCurrent,
        streakMax: attempt.streakMax,
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

// Finalizar intento (rendirse) sin borrar datos
export const finishTestAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attempt = await prisma.testAttempt.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!attempt) {
      throw new AppError('Intento de test no encontrado', 404);
    }

    if (attempt.tiempoFin) {
      throw new AppError('Este test ya ha sido completado', 400);
    }

    const totalRespondidas = attempt.cantidadCorrectas + attempt.cantidadIncorrectas;
    const puntaje = totalRespondidas > 0
      ? Math.round((attempt.cantidadCorrectas / totalRespondidas) * 10)
      : 0;

    await prisma.testAttempt.update({
      where: { id },
      data: {
        tiempoFin: new Date(),
        puntaje,
      },
    });

    res.json({
      success: true,
      data: {
        puntaje,
        cantidadCorrectas: attempt.cantidadCorrectas,
        cantidadIncorrectas: attempt.cantidadIncorrectas,
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

    // Aplicar shuffle a las preguntas
    const attemptWithShuffled = {
      ...attempt,
      test: {
        ...attempt.test,
        questions: attempt.test.questions.map((q) => {
          const shuffled = shuffleQuestionOptions(q.pregunta);
          // Conservar campos originales (titulo, enunciado, opciones) y solo mezclar opciones
          return {
            ...q,
            pregunta: {
              ...q.pregunta,
              ...shuffled,
            },
          };
        }),
      },
    };

    res.json({
      success: true,
      data: { attempt: attemptWithShuffled },
    });
  } catch (error) {
    next(error);
  }
};

// Exportar test a PDF
export const exportTestToPDF = async (req, res, next) => {
  try {
    const { testId } = req.params;
    const { withAnswers = false } = req.query;

    if (!testId) {
      throw new AppError('testId es requerido', 400);
    }

    // Obtener test con preguntas
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            pregunta: {
              include: {
                tema: {
                  include: {
                    oposicion: true,
                  },
                },
              },
            },
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    if (!test) {
      throw new AppError('Test no encontrado', 404);
    }

    // Extraer preguntas con oposicion desde tema
    const preguntas = test.questions.map((q) => ({
      ...q.pregunta,
      oposicion: q.pregunta.tema?.oposicion || null,
    }));

    if (preguntas.length === 0) {
      throw new AppError('El test no tiene preguntas', 400);
    }

    // Generar PDF
    const doc = generateTestPDF(
      {
        ...test,
        oposicion: preguntas[0]?.oposicion || null,
      },
      preguntas,
      {
        withAnswers: withAnswers === 'true',
      }
    );

    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="test-${testId}.pdf"`
    );

    // Pipe del PDF al response
    doc.pipe(res);

    logger.info(`✅ PDF generado para test ${testId}`);
  } catch (error) {
    next(error);
  }
};
