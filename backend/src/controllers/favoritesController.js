import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Toggle favorito (marcar/desmarcar)
export const toggleFavorite = async (req, res, next) => {
  try {
    const { preguntaId } = req.params;
    const userId = req.user.id;

    if (!preguntaId) {
      throw new AppError('preguntaId es requerido', 400);
    }

    // Verificar que la pregunta existe
    const pregunta = await prisma.pregunta.findUnique({
      where: { id: preguntaId },
    });

    if (!pregunta) {
      throw new AppError('Pregunta no encontrada', 404);
    }

    // Verificar si ya está en favoritos
    const existing = await prisma.favoritePregunta.findUnique({
      where: {
        userId_preguntaId: {
          userId,
          preguntaId,
        },
      },
    });

    if (existing) {
      // Desmarcar favorito
      await prisma.favoritePregunta.delete({
        where: { id: existing.id },
      });

      logger.info(`✅ Favorito eliminado: usuario ${userId} pregunta ${preguntaId}`);

      return res.json({
        success: true,
        message: 'Favorito eliminado',
        data: { isFavorite: false },
      });
    } else {
      // Marcar como favorito
      await prisma.favoritePregunta.create({
        data: {
          userId,
          preguntaId,
        },
      });

      logger.info(`⭐ Favorito agregado: usuario ${userId} pregunta ${preguntaId}`);

      return res.json({
        success: true,
        message: 'Favorito agregado',
        data: { isFavorite: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

// Obtener todas las preguntas favoritas del usuario
export const getFavorites = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [favorites, total] = await Promise.all([
      prisma.favoritePregunta.findMany({
        where: { userId },
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
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.favoritePregunta.count({ where: { userId } }),
    ]);

    const preguntas = favorites.map((f) => ({
      ...f.pregunta,
      favoritoId: f.id,
      favoritoCreatedAt: f.createdAt,
    }));

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

// Verificar si una pregunta está en favoritos
export const checkFavorite = async (req, res, next) => {
  try {
    const { preguntaId } = req.params;
    const userId = req.user.id;

    const favorite = await prisma.favoritePregunta.findUnique({
      where: {
        userId_preguntaId: {
          userId,
          preguntaId,
        },
      },
    });

    res.json({
      success: true,
      data: { isFavorite: !!favorite },
    });
  } catch (error) {
    next(error);
  }
};
