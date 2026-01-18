import express from 'express';
import {
  getOposiciones,
  getOposicion,
  createOposicion,
  updateOposicion,
  deleteOposicion,
} from '../controllers/oposicionesController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getOposiciones);
router.get('/:id', getOposicion);
router.post('/', authMiddleware, adminMiddleware, createOposicion);
router.put('/:id', authMiddleware, adminMiddleware, updateOposicion);
router.delete('/:id', authMiddleware, adminMiddleware, deleteOposicion);

export default router;
