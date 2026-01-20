import express from 'express';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoritesController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.post('/preguntas/:preguntaId/favorite', authMiddleware, toggleFavorite);
router.get('/preguntas/favorites', authMiddleware, getFavorites);
router.get('/preguntas/:preguntaId/favorite', authMiddleware, checkFavorite);

export default router;
