import { PrismaClient } from '@prisma/client';
import {
  getAnkiStateForGrade,
  getDueQuestions,
  getReviewStats
} from '../utils/ankiAlgorithm.js';

const prisma = new PrismaClient();

/**
 * Actualizar estado Anki de una pregunta
 * POST /api/v1/anki/preguntas/:id/grade
 * Body: { grade: "OTRA_VEZ" | "DIFICIL" | "BIEN" | "FACIL" }
 */
const updateQuestionGrade = async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;

    if (!['OTRA_VEZ', 'DIFICIL', 'BIEN', 'FACIL'].includes(grade)) {
      return res.status(400).json({
        success: false,
        error: 'Grade debe ser: OTRA_VEZ, DIFICIL, BIEN o FACIL'
      });
    }

    const pregunta = await prisma.pregunta.findUnique({
      where: { id }
    });

    if (!pregunta) {
      return res.status(404).json({
        success: false,
        error: 'Pregunta no encontrada'
      });
    }

    // Calcular nuevo estado Anki
    const currentState = {
      easeFactor: pregunta.easeFactor,
      interval: pregunta.interval,
      repetitions: pregunta.repetitions
    };

    const newState = getAnkiStateForGrade(currentState, grade);

    // Actualizar pregunta
    const updatedPregunta = await prisma.pregunta.update({
      where: { id },
      data: {
        easeFactor: newState.easeFactor,
        interval: newState.interval,
        repetitions: newState.repetitions,
        dueDate: newState.dueDate,
        lastReview: newState.lastReview
      }
    });

    res.json({
      success: true,
      pregunta: updatedPregunta
    });
  } catch (error) {
    console.error('Error al actualizar grade Anki:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado Anki'
    });
  }
};

/**
 * Obtener preguntas vencidas por tema(s)
 * GET /api/v1/anki/preguntas/due
 * Query: temasIds[] (array de IDs de temas)
 */
const getDueQuestionsForTemas = async (req, res) => {
  try {
    const { temasIds } = req.query;

    if (!temasIds || !Array.isArray(temasIds) || temasIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'temasIds es requerido (array)'
      });
    }

    // Obtener todas las preguntas de esos temas
    const preguntas = await prisma.pregunta.findMany({
      where: {
        temaId: {
          in: temasIds
        },
        status: 'PUBLISHED'
      },
      include: {
        tema: {
          include: {
            oposicion: true
          }
        }
      }
    });

    // Filtrar solo las vencidas
    const dueQuestions = getDueQuestions(preguntas);

    res.json({
      success: true,
      preguntas: dueQuestions,
      total: dueQuestions.length
    });
  } catch (error) {
    console.error('Error al obtener preguntas vencidas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener preguntas vencidas'
    });
  }
};

/**
 * Obtener estadísticas Anki por oposición
 * GET /api/v1/anki/oposiciones/:id/stats
 */
const getAnkiStatsByOposicion = async (req, res) => {
  try {
    const { id } = req.params;

    const preguntas = await prisma.pregunta.findMany({
      where: {
        tema: {
          oposicionId: id
        },
        status: 'PUBLISHED'
      }
    });

    const stats = getReviewStats(preguntas);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error al obtener stats Anki:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Obtener estadísticas Anki por tema
 * GET /api/v1/anki/temas/:id/stats
 */
const getAnkiStatsByTema = async (req, res) => {
  try {
    const { id } = req.params;

    const preguntas = await prisma.pregunta.findMany({
      where: {
        temaId: id,
        status: 'PUBLISHED'
      }
    });

    const stats = getReviewStats(preguntas);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error al obtener stats Anki por tema:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas'
    });
  }
};

/**
 * Actualizar múltiples preguntas después de un test
 * POST /api/v1/anki/batch-update
 * Body: { updates: [{ preguntaId, grade }] }
 */
const batchUpdateGrades = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'updates debe ser un array no vacío'
      });
    }

    const results = [];

    for (const update of updates) {
      const { preguntaId, grade } = update;

      const pregunta = await prisma.pregunta.findUnique({
        where: { id: preguntaId }
      });

      if (!pregunta) {
        results.push({
          preguntaId,
          success: false,
          error: 'Pregunta no encontrada'
        });
        continue;
      }

      const currentState = {
        easeFactor: pregunta.easeFactor,
        interval: pregunta.interval,
        repetitions: pregunta.repetitions
      };

      const newState = getAnkiStateForGrade(currentState, grade);

      await prisma.pregunta.update({
        where: { id: preguntaId },
        data: {
          easeFactor: newState.easeFactor,
          interval: newState.interval,
          repetitions: newState.repetitions,
          dueDate: newState.dueDate,
          lastReview: newState.lastReview
        }
      });

      results.push({
        preguntaId,
        success: true,
        newState
      });
    }

    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error en batch update:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar en lote'
    });
  }
};

export {
  updateQuestionGrade,
  getDueQuestionsForTemas,
  getAnkiStatsByOposicion,
  getAnkiStatsByTema,
  batchUpdateGrades
};
