import { Router } from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import {
  createQuestionReport,
  getQuestionReports,
  getQuestionReportsByPregunta,
  updateReportStatus,
  deleteReport,
  deleteReportsByPregunta,
} from '../controllers/reportsController.js';

const router = Router();

// Rutas públicas (requieren autenticación de usuario)
router.post(
  '/preguntas/:preguntaId/report',
  authMiddleware,
  createQuestionReport
);

// Rutas de admin
router.get(
  '/reports',
  authMiddleware,
  adminMiddleware,
  getQuestionReports
);

router.get(
  '/preguntas/:preguntaId/reports',
  authMiddleware,
  adminMiddleware,
  getQuestionReportsByPregunta
);

router.patch(
  '/reports/:reportId/status',
  authMiddleware,
  adminMiddleware,
  updateReportStatus
);

router.delete(
  '/reports/:reportId',
  authMiddleware,
  adminMiddleware,
  deleteReport
);

router.delete(
  '/preguntas/:preguntaId/reports',
  authMiddleware,
  adminMiddleware,
  deleteReportsByPregunta
);

export default router;
