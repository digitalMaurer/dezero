import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

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
