import express from 'express';
import {
  createTestAttempt,
  submitTestAttempt,
  answerQuestionManicomio,
  getTestAttempt,
  getUserTestHistory,
  getUserStats,
} from '../controllers/testsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/attempts', authMiddleware, createTestAttempt);
router.post('/attempts/submit', authMiddleware, submitTestAttempt);
router.post('/attempts/:id/answer', authMiddleware, answerQuestionManicomio);
router.get('/attempts/:id', authMiddleware, getTestAttempt);
router.get('/history', authMiddleware, getUserTestHistory);
router.get('/stats', authMiddleware, getUserStats);

export default router;
