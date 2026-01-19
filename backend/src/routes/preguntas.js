import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  getPreguntas,
  getPregunta,
  createPregunta,
  updatePregunta,
  deletePregunta,
  generateRandomTest,
  bulkUpdateTema,
  uploadPreguntaImage,
} from '../controllers/preguntasController.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();
const uploadsDir = path.join(process.cwd(), 'uploads', 'preguntas');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadsDir, { recursive: true });
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '') || 'imagen';
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    const error = new Error('Formato de imagen no permitido');
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
});

router.get('/', getPreguntas);
router.get('/random', authMiddleware, generateRandomTest);
router.get('/:id', getPregunta);
router.post('/', authMiddleware, adminMiddleware, createPregunta);
router.put('/:id', authMiddleware, adminMiddleware, updatePregunta);
router.delete('/:id', authMiddleware, adminMiddleware, deletePregunta);
router.post('/bulk-update-tema', authMiddleware, adminMiddleware, bulkUpdateTema);
router.post('/upload-image', authMiddleware, adminMiddleware, upload.single('image'), uploadPreguntaImage);

export default router;
