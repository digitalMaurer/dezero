import express from 'express';
import {
  createTestAttempt,
  submitTestAttempt,
  finishTestAttempt,
  getTestAttempt,
  deleteTestAttempt,
} from '../controllers/tests/attemptsController.js';
import {
  answerQuestionManicomio,
  getNextManicomioQuestion,
} from '../controllers/tests/manicomioController.js';
import {
  getUserTestHistory,
  getUserStats,
} from '../controllers/tests/statsController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/attempts', authMiddleware, createTestAttempt);
router.post('/attempts/submit', authMiddleware, submitTestAttempt);
router.post('/attempts/:id/finish', authMiddleware, finishTestAttempt);
router.post('/attempts/:id/answer', authMiddleware, answerQuestionManicomio);
router.get('/attempts/:id/next-question', authMiddleware, getNextManicomioQuestion);
router.get('/attempts/:id', authMiddleware, getTestAttempt);
router.delete('/attempts/:id', authMiddleware, deleteTestAttempt);
router.get('/history', authMiddleware, getUserTestHistory);
router.get('/stats', authMiddleware, getUserStats);

export default router;
