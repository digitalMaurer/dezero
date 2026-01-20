import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { getPreguntasConFiltro, ordenarPreguntas } from '../utils/filtroPreguntas.js';
import { shuffleQuestionOptions } from '../utils/shuffleUtils.js';

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
      streakTarget = 30  // Para modo Manicomio
    } = req.body;
    const userId = req.user.id;

    if (!oposicionId) {
      throw new AppError('oposicionId es requerido', 400);
    }

    // Aceptar temaId (singular) o temaIds (array)
    const temasSeleccionados = temaIds && Array.isArray(temaIds) ? temaIds : (temaId ? [temaId] : null);

    let preguntas = [];

    // Modo Manicomio: cargar preguntas dinámicamente, no carga todas al inicio
    if (mode === 'MANICOMIO') {
      // Obtener una pregunta inicial para el test (el resto se cargan dinámicamente)
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

      const todosDisponibles = await prisma.pregunta.findMany({ where, take: 1 });
      if (todosDisponibles.length === 0) {
        throw new AppError('No hay preguntas disponibles con esos criterios', 404);
      }
      preguntas = todosDisponibles; // Solo una para iniciarlo
    } else if (mode === 'FILTRADO' && filtroTipo) {
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
    } else if (mode === 'SIMULACRO_EXAMEN') {
      // Modo simulacro oficial: repartir equilibradamente entre temas seleccionados
      if (!temasSeleccionados || temasSeleccionados.length === 0) {
        throw new AppError('Selecciona al menos un tema para el simulacro', 400);
      }

      // Obtener preguntas por tema
      const preguntasPorTema = await Promise.all(
        temasSeleccionados.map(async (tId) => {
          const where = {
            status: 'PUBLISHED',
            temaId: tId,
          };
          if (dificultad) where.dificultad = dificultad;
          const items = await prisma.pregunta.findMany({ where });
          // Mezclar por tema
          return { temaId: tId, items: items.sort(() => Math.random() - 0.5) };
        })
      );

      const totalDisponibles = preguntasPorTema.reduce((sum, t) => sum + t.items.length, 0);
      let targetTotal = cantidad ? parseInt(cantidad) : 100; // Por defecto 100 para simulacro
      if (Number.isNaN(targetTotal) || targetTotal <= 0) targetTotal = 100;
      if (targetTotal > totalDisponibles) targetTotal = totalDisponibles;

      // Cálculo de cupos equilibrados
      const n = preguntasPorTema.length;
      const base = Math.floor(targetTotal / n);
      let resto = targetTotal % n;
      const cupos = preguntasPorTema.map((t) => {
        const max = t.items.length;
        const cuota = Math.min(base + (resto > 0 ? 1 : 0), max);
        if (resto > 0) resto -= 1;
        return cuota;
      });

      // Redistribuir si alguna quedó por debajo y hay remanente
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
        // Evitar bucle infinito si no hay capacidad extra
        if (idx > cupos.length * 2 && faltan > 0) break;
      }

      // Seleccionar preguntas según cupos
      preguntas = [];
      preguntasPorTema.forEach((t, i) => {
        const take = cupos[i];
        if (take > 0) {
          preguntas.push(...t.items.slice(0, take));
        }
      });

      // Mezclar globalmente
      preguntas = preguntas.sort(() => Math.random() - 0.5);
    } else if (mode === 'FAVORITOS') {
      // Modo favoritos: solo preguntas marcadas como favoritas
      const favoritos = await prisma.favoritePregunta.findMany({
        where: { userId },
        include: {
          pregunta: {
            where: {
              status: 'PUBLISHED',
              ...(dificultad && { dificultad }),
              ...(temasSeleccionados && temasSeleccionados.length > 0 && { temaId: { in: temasSeleccionados } }),
            },
          },
        },
      });

      preguntas = favoritos
        .map((f) => f.pregunta)
        .filter((p) => p !== null); // Filtrar null si la pregunta no cumple los criterios

      if (preguntas.length === 0) {
        throw new AppError('No tienes preguntas favoritas con esos criterios', 404);
      }

      // Mezclar aleatoriamente
      preguntas = preguntas.sort(() => Math.random() - 0.5);
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

    // Limitar a la cantidad solicitada (si no se especifica cantidad, usar todas)
    const cantidadParaUsar = cantidad ? parseInt(cantidad) : preguntas.length;
    const preguntasSeleccionadas = preguntas.slice(0, cantidadParaUsar);

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
        streakTarget: mode === 'MANICOMIO' ? streakTarget : 30, // Usar streakTarget en Manicomio
        tiempoInicio: new Date(),
      },
    });

    // Devolver preguntas sin respuestas (con opciones mezcladas)
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
        respuestaCorrecta: shuffled.respuestaCorrecta,
        dificultad: q.pregunta.dificultad,
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

    res.json({
      success: true,
      data: {
        esCorrecta,
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
                pregunta: true,
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

    if (attempt.mode !== 'MANICOMIO') {
      throw new AppError('Este endpoint es solo para modo MANICOMIO', 400);
    }

    if (attempt.tiempoFin) {
      throw new AppError('Este test ya ha finalizado', 400);
    }

    // Obtener IDs de preguntas ya respondidas
    const respondidas = attempt.respuestas.map((r) => r.preguntaId);

    // Obtener preguntas del test que NO hayan sido respondidas
    const disponibles = attempt.test.questions.filter(
      (q) => !respondidas.includes(q.preguntaId)
    );

    if (disponibles.length === 0) {
      // Si no hay preguntas disponibles del test fijo, obtener nuevas del mismo tema/dificultad
      // Esto permite preguntas ilimitadas en MANICOMIO
      const tema = attempt.test.questions[0]?.pregunta?.tema;
      const dificultad = attempt.test.questions[0]?.pregunta?.dificultad;

      const nuevas = await prisma.pregunta.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: respondidas }, // Excluir ya respondidas
          ...(tema && { tema: { oposicionId: tema.oposicionId } }),
          ...(dificultad && { dificultad }),
        },
        take: 10, // Cargar algunas más para elegir aleatoriamente
      });

      if (nuevas.length === 0) {
        throw new AppError('No hay preguntas disponibles', 404);
      }

      const selected = nuevas[Math.floor(Math.random() * nuevas.length)];
      const shuffled = shuffleQuestionOptions(selected);

      return res.json({
        success: true,
        data: {
          id: shuffled.id,
          titulo: shuffled.titulo,
          enunciado: shuffled.enunciado,
          opcionA: shuffled.opcionA,
          opcionB: shuffled.opcionB,
          opcionC: shuffled.opcionC,
          opcionD: shuffled.opcionD,
          dificultad: shuffled.dificultad,
        },
      });
    }

    // Seleccionar una pregunta aleatoria de las disponibles
    const nextQuestion = disponibles[Math.floor(Math.random() * disponibles.length)];
    const shuffled = shuffleQuestionOptions(nextQuestion.pregunta);

    res.json({
      success: true,
      data: {
        id: shuffled.id,
        titulo: shuffled.titulo,
        enunciado: shuffled.enunciado,
        opcionA: shuffled.opcionA,
        opcionB: shuffled.opcionB,
        opcionC: shuffled.opcionC,
        opcionD: shuffled.opcionD,
        dificultad: shuffled.dificultad,
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
        questions: attempt.test.questions.map((q) => ({
          ...q,
          pregunta: shuffleQuestionOptions(q.pregunta),
        })),
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
