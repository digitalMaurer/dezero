import express from 'express';
import {
  getPreguntas,
  getPregunta,
  createPregunta,
  updatePregunta,
  deletePregunta,
  generateRandomTest,
} from '../controllers/preguntasController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getPreguntas);
router.get('/random', authMiddleware, generateRandomTest);
router.get('/:id', getPregunta);
router.post('/', authMiddleware, adminMiddleware, createPregunta);
router.put('/:id', authMiddleware, adminMiddleware, updatePregunta);
router.delete('/:id', authMiddleware, adminMiddleware, deletePregunta);

export default router;
