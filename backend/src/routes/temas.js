import express from 'express';
import {
  getTemas,
  getTema,
  createTema,
  updateTema,
  deleteTema,
  copyTema,
} from '../controllers/temasController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getTemas);
router.get('/:id', getTema);
router.post('/', authMiddleware, adminMiddleware, createTema);
router.post('/:id/copy', authMiddleware, adminMiddleware, copyTema);
router.put('/:id', authMiddleware, adminMiddleware, updateTema);
router.delete('/:id', authMiddleware, adminMiddleware, deleteTema);

export default router;
