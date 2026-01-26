import pkg from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

export const getTemas = async (req, res, next) => {
  try {
    const { oposicionId } = req.query;

    const where = oposicionId ? { oposicionId } : {};

    const temas = await prisma.tema.findMany({
      where,
      include: {
        oposicion: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        _count: {
          select: {
            preguntas: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    // Enriquecer con conteo de activas y duplicadas
    const enrichedTemas = await Promise.all(temas.map(async (tema) => {
      const totalActive = await prisma.pregunta.count({
        where: {
          temaId: tema.id,
          duplicateStatus: 'ACTIVE'
        }
      });
      
      const totalDuplicated = await prisma.pregunta.count({
        where: {
          temaId: tema.id,
          duplicateStatus: 'DUPLICATED'
        }
      });

      return {
        ...tema,
        _count: {
          preguntas: totalActive,  // Solo activas
          preguntasTotal: totalActive + totalDuplicated,
          preguntasDuplicated: totalDuplicated
        }
      };
    }));

    res.json({
      success: true,
      data: { temas: enrichedTemas },
    });
  } catch (error) {
    next(error);
  }
};

export const getTema = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tema = await prisma.tema.findUnique({
      where: { id },
      include: {
        oposicion: true,
        preguntas: {
          select: {
            id: true,
            titulo: true,
            dificultad: true,
            status: true,
          },
        },
        statistics: true,
      },
    });

    if (!tema) {
      throw new AppError('Tema no encontrado', 404);
    }

    res.json({
      success: true,
      data: { tema },
    });
  } catch (error) {
    next(error);
  }
};

export const createTema = async (req, res, next) => {
  try {
    const { nombre, descripcion, oposicionId } = req.body;

    if (!nombre || !oposicionId) {
      throw new AppError('Nombre y oposicionId son requeridos', 400);
    }

    // Verificar que la oposición existe
    const oposicionExists = await prisma.oposicion.findUnique({
      where: { id: oposicionId },
    });

    if (!oposicionExists) {
      throw new AppError('Oposición no encontrada', 404);
    }

    // Verificar si ya existe un tema con el mismo nombre en esa oposición
    const temaExists = await prisma.tema.findFirst({
      where: {
        nombre,
        oposicionId,
      },
    });

    if (temaExists) {
      throw new AppError('Ya existe un tema con ese nombre en esta oposición', 400);
    }

    const tema = await prisma.tema.create({
      data: {
        nombre,
        descripcion,
        oposicionId,
      },
      include: {
        oposicion: true,
      },
    });

    logger.info(`✅ Tema creado: ${nombre}`);

    res.status(201).json({
      success: true,
      message: 'Tema creado exitosamente',
      data: { tema },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, oposicionId } = req.body;

    // Si se cambia oposicionId (mover tema), verificar que existe
    if (oposicionId) {
      const oposicionExists = await prisma.oposicion.findUnique({
        where: { id: oposicionId },
      });
      if (!oposicionExists) {
        throw new AppError('Oposición destino no encontrada', 404);
      }
    }

    const tema = await prisma.tema.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        ...(oposicionId && { oposicionId }),
      },
      include: {
        oposicion: true,
      },
    });

    logger.info(`✅ Tema actualizado: ${tema.nombre}`);

    res.json({
      success: true,
      message: 'Tema actualizado',
      data: { tema },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Tema no encontrado', 404));
    }
    next(error);
  }
};

export const deleteTema = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que el tema existe y contar preguntas
    const tema = await prisma.tema.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            preguntas: true,
          },
        },
      },
    });

    if (!tema) {
      throw new AppError('Tema no encontrado', 404);
    }

    if (tema._count.preguntas > 0) {
      throw new AppError(
        `No se puede eliminar el tema porque tiene ${tema._count.preguntas} preguntas asociadas`,
        400
      );
    }

    await prisma.tema.delete({
      where: { id },
    });

    logger.info(`✅ Tema eliminado: ${tema.nombre}`);

    res.json({
      success: true,
      message: 'Tema eliminado',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError('Tema no encontrado', 404));
    }
    next(error);
  }
};

// Copiar tema a otra oposición (duplica tema + todas sus preguntas)
export const copyTema = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetOposicionId } = req.body;

    if (!targetOposicionId) {
      throw new AppError('targetOposicionId es requerido', 400);
    }

    // Verificar que el tema origen existe
    const temaOriginal = await prisma.tema.findUnique({
      where: { id },
      include: {
        preguntas: true,
      },
    });

    if (!temaOriginal) {
      throw new AppError('Tema no encontrado', 404);
    }

    // Verificar que la oposición destino existe
    const oposicionDestino = await prisma.oposicion.findUnique({
      where: { id: targetOposicionId },
    });

    if (!oposicionDestino) {
      throw new AppError('Oposición destino no encontrada', 404);
    }

    // Crear nuevo tema en oposición destino
    const nuevoTema = await prisma.$transaction(async (tx) => {
      // Crear tema duplicado
      const temaCopia = await tx.tema.create({
        data: {
          nombre: `${temaOriginal.nombre} (copia)`,
          descripcion: temaOriginal.descripcion,
          oposicionId: targetOposicionId,
        },
      });

      // Copiar todas las preguntas asociadas
      if (temaOriginal.preguntas.length > 0) {
        const preguntasCopia = temaOriginal.preguntas.map((p) => ({
          titulo: p.titulo,
          enunciado: p.enunciado,
          opcionA: p.opcionA,
          opcionB: p.opcionB,
          opcionC: p.opcionC,
          opcionD: p.opcionD,
          respuestaCorrecta: p.respuestaCorrecta,
          explicacion: p.explicacion,
          tip: p.tip,
          dificultad: p.dificultad,
          status: p.status,
          temaId: temaCopia.id,
          imagenUrl: p.imagenUrl,
        }));

        await tx.pregunta.createMany({
          data: preguntasCopia,
        });
      }

      return temaCopia;
    });

    logger.info(
      `✅ Tema copiado: "${temaOriginal.nombre}" → "${nuevoTema.nombre}" (${temaOriginal.preguntas.length} preguntas)`
    );

    res.status(201).json({
      success: true,
      message: `Tema copiado con ${temaOriginal.preguntas.length} preguntas`,
      data: { tema: nuevoTema },
    });
  } catch (error) {
    next(error);
  }
};
