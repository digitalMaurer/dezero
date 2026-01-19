import express from 'express';
import * as ankiController from '../controllers/ankiController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Actualizar calificación de una pregunta
router.post('/preguntas/:id/grade', ankiController.updateQuestionGrade);

// Obtener preguntas vencidas por tema(s)
router.get('/preguntas/due', ankiController.getDueQuestionsForTemas);

// Estadísticas Anki por oposición
router.get('/oposiciones/:id/stats', ankiController.getAnkiStatsByOposicion);

// Estadísticas Anki por tema
router.get('/temas/:id/stats', ankiController.getAnkiStatsByTema);

// Actualización en lote
router.post('/batch-update', ankiController.batchUpdateGrades);

export default router;
