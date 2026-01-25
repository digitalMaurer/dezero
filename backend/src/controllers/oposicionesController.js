import pkg from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getOposiciones = async (req, res, next) => {
  try {
    const oposiciones = await prisma.oposicion.findMany({
      include: {
        temas: {
          select: {
            id: true,
            nombre: true,
            _count: { select: { preguntas: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: { oposiciones },
    });
  } catch (error) {
    next(error);
  }
};

export const getOposicion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const oposicion = await prisma.oposicion.findUnique({
      where: { id },
      include: {
        temas: {
          include: {
            _count: { select: { preguntas: true } },
            statistics: true,
          },
        },
      },
    });

    if (!oposicion) {
      throw new AppError('Oposición no encontrada', 404);
    }

    res.json({
      success: true,
      data: { oposicion },
    });
  } catch (error) {
    next(error);
  }
};

export const createOposicion = async (req, res, next) => {
  try {
    const { nombre, codigo, descripcion } = req.body;

    if (!nombre || !codigo) {
      throw new AppError('Nombre y código son requeridos', 400);
    }

    // Verificar si ya existe
    const exists = await prisma.oposicion.findUnique({
      where: { codigo },
    });

    if (exists) {
      throw new AppError('El código ya existe', 400);
    }

    const oposicion = await prisma.oposicion.create({
      data: { nombre, codigo, descripcion },
    });

    logger.info(`✅ Oposición creada: ${nombre}`);

    res.status(201).json({
      success: true,
      message: 'Oposición creada exitosamente',
      data: { oposicion },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOposicion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, visible } = req.body;

    // Construir objeto de actualización solo con los campos enviados
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;
    if (visible !== undefined) updateData.visible = visible;

    const oposicion = await prisma.oposicion.update({
      where: { id },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Oposición actualizada',
      data: { oposicion },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Oposición no encontrada', 404));
    }
    next(error);
  }
};

export const deleteOposicion = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.oposicion.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Oposición eliminada',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Oposición no encontrada', 404));
    }
    next(error);
  }
};
