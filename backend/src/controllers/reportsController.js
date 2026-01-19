import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

// Crear reporte de pregunta
export const createQuestionReport = async (req, res, next) => {
  try {
    const { preguntaId } = req.params;
    const { mensaje } = req.body;
    const userId = req.user.id;

    if (!preguntaId) {
      throw new AppError('preguntaId es requerido', 400);
    }

    if (!mensaje || mensaje.trim() === '') {
      throw new AppError('El mensaje no puede estar vacío', 400);
    }

    // Verificar que la pregunta existe
    const pregunta = await prisma.pregunta.findUnique({
      where: { id: preguntaId },
    });

    if (!pregunta) {
      throw new AppError('Pregunta no encontrada', 404);
    }

    // Crear el reporte
    const report = await prisma.questionReport.create({
      data: {
        preguntaId,
        userId,
        motivo: 'REPORTE_USUARIO',
        descripcion: mensaje,
        estado: 'PENDIENTE',
      },
      include: {
        pregunta: true,
        user: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
    });

    logger.info(`✅ Reporte creado: ${report.id} para pregunta ${preguntaId}`);

    res.status(201).json({
      success: true,
      message: 'Reporte enviado correctamente',
      data: {
        report,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los reportes (admin)
export const getQuestionReports = async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 20 } = req.query;

    const where = {};
    if (estado) {
      where.estado = estado;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      prisma.questionReport.findMany({
        where,
        include: {
          pregunta: {
            select: {
              id: true,
              enunciado: true,
              titulo: true,
              dificultad: true,
              tema: {
                select: {
                  nombre: true,
                  oposicion: {
                    select: {
                      nombre: true,
                      codigo: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              nombre: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: parseInt(limit),
      }),
      prisma.questionReport.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        reports,
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

// Obtener reportes de una pregunta específica
export const getQuestionReportsByPregunta = async (req, res, next) => {
  try {
    const { preguntaId } = req.params;

    const reports = await prisma.questionReport.findMany({
      where: { preguntaId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: {
        reports,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar estado de reporte
export const updateReportStatus = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { estado } = req.body;

    if (!reportId) {
      throw new AppError('reportId es requerido', 400);
    }

    if (!estado || !['PENDIENTE', 'REVISADO', 'RESUELTO'].includes(estado)) {
      throw new AppError('estado debe ser PENDIENTE, REVISADO o RESUELTO', 400);
    }

    // Verificar que el reporte existe
    const report = await prisma.questionReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError('Reporte no encontrado', 404);
    }

    // Actualizar estado
    const updatedReport = await prisma.questionReport.update({
      where: { id: reportId },
      data: { estado },
    });

    logger.info(`✅ Reporte ${reportId} actualizado a estado ${estado}`);

    res.json({
      success: true,
      message: 'Estado del reporte actualizado',
      data: {
        report: updatedReport,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar reporte
export const deleteReport = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      throw new AppError('reportId es requerido', 400);
    }

    // Verificar que el reporte existe
    const report = await prisma.questionReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new AppError('Reporte no encontrado', 404);
    }

    // Eliminar reporte
    await prisma.questionReport.delete({
      where: { id: reportId },
    });

    logger.info(`✅ Reporte ${reportId} eliminado`);

    res.json({
      success: true,
      message: 'Reporte eliminado',
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar todos los reportes de una pregunta
export const deleteReportsByPregunta = async (req, res, next) => {
  try {
    const { preguntaId } = req.params;

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

    // Eliminar todos los reportes
    const result = await prisma.questionReport.deleteMany({
      where: { preguntaId },
    });

    logger.info(`✅ ${result.count} reporte(s) eliminado(s) para pregunta ${preguntaId}`);

    res.json({
      success: true,
      message: `${result.count} reporte(s) eliminado(s)`,
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
};
