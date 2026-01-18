import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const getPreguntas = async (req, res, next) => {
  try {
    const { temaId, dificultad, status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (temaId) where.temaId = temaId;
    if (dificultad) where.dificultad = dificultad;
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [preguntas, total] = await Promise.all([
      prisma.pregunta.findMany({
        where,
        include: {
          tema: {
            select: {
              id: true,
              nombre: true,
              oposicion: {
                select: {
                  id: true,
                  nombre: true,
                  codigo: true,
                },
              },
            },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.pregunta.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        preguntas,
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

export const getPregunta = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pregunta = await prisma.pregunta.findUnique({
      where: { id },
      include: {
        tema: {
          include: {
            oposicion: true,
          },
        },
        statistics: true,
      },
    });

    if (!pregunta) {
      throw new AppError('Pregunta no encontrada', 404);
    }

    res.json({
      success: true,
      data: { pregunta },
    });
  } catch (error) {
    next(error);
  }
};

export const createPregunta = async (req, res, next) => {
  try {
    const {
      titulo,
      enunciado,
      opcionA,
      opcionB,
      opcionC,
      opcionD,
      respuestaCorrecta,
      explicacion,
      dificultad = 'MEDIUM',
      status = 'DRAFT',
      temaId,
    } = req.body;

    // Validaciones
    if (!titulo || !enunciado || !opcionA || !opcionB || !opcionC || !respuestaCorrecta || !temaId) {
      throw new AppError('Campos requeridos faltantes', 400);
    }

    if (!['A', 'B', 'C', 'D'].includes(respuestaCorrecta)) {
      throw new AppError('Respuesta correcta debe ser A, B, C o D', 400);
    }

    if (!['EASY', 'MEDIUM', 'HARD'].includes(dificultad)) {
      throw new AppError('Dificultad debe ser EASY, MEDIUM o HARD', 400);
    }

    // Verificar que el tema existe
    const temaExists = await prisma.tema.findUnique({
      where: { id: temaId },
    });

    if (!temaExists) {
      throw new AppError('Tema no encontrado', 404);
    }

    const pregunta = await prisma.pregunta.create({
      data: {
        titulo,
        enunciado,
        opcionA,
        opcionB,
        opcionC,
        opcionD,
        respuestaCorrecta,
        explicacion,
        dificultad,
        status,
        temaId,
      },
      include: {
        tema: {
          include: {
            oposicion: true,
          },
        },
      },
    });

    logger.info(`✅ Pregunta creada: ${titulo}`);

    res.status(201).json({
      success: true,
      message: 'Pregunta creada exitosamente',
      data: { pregunta },
    });
  } catch (error) {
    next(error);
  }
};

export const updatePregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validar respuestaCorrecta si se envía
    if (updateData.respuestaCorrecta && !['A', 'B', 'C', 'D'].includes(updateData.respuestaCorrecta)) {
      throw new AppError('Respuesta correcta debe ser A, B, C o D', 400);
    }

    // Validar dificultad si se envía
    if (updateData.dificultad && !['EASY', 'MEDIUM', 'HARD'].includes(updateData.dificultad)) {
      throw new AppError('Dificultad debe ser EASY, MEDIUM o HARD', 400);
    }

    const pregunta = await prisma.pregunta.update({
      where: { id },
      data: updateData,
      include: {
        tema: {
          include: {
            oposicion: true,
          },
        },
      },
    });

    logger.info(`✅ Pregunta actualizada: ${pregunta.titulo}`);

    res.json({
      success: true,
      message: 'Pregunta actualizada',
      data: { pregunta },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Pregunta no encontrada', 404));
    }
    next(error);
  }
};

export const deletePregunta = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.pregunta.delete({
      where: { id },
    });

    logger.info(`✅ Pregunta eliminada: ${id}`);

    res.json({
      success: true,
      message: 'Pregunta eliminada',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Pregunta no encontrada', 404));
    }
    next(error);
  }
};

// Generar test aleatorio
export const generateRandomTest = async (req, res, next) => {
  try {
    const { temaId, cantidad = 10, dificultad } = req.query;

    if (!temaId) {
      throw new AppError('temaId es requerido', 400);
    }

    const where = {
      temaId,
      status: 'PUBLISHED',
    };

    if (dificultad) {
      where.dificultad = dificultad;
    }

    // Obtener preguntas aleatorias
    const preguntas = await prisma.pregunta.findMany({
      where,
      take: parseInt(cantidad),
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (preguntas.length === 0) {
      throw new AppError('No hay preguntas disponibles para este tema', 404);
    }

    // Mezclar preguntas aleatoriamente
    const preguntasMezcladas = preguntas.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      data: {
        preguntas: preguntasMezcladas.map((p) => ({
          id: p.id,
          titulo: p.titulo,
          enunciado: p.enunciado,
          opcionA: p.opcionA,
          opcionB: p.opcionB,
          opcionC: p.opcionC,
          opcionD: p.opcionD,
          dificultad: p.dificultad,
          // No enviamos respuestaCorrecta ni explicacion
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
