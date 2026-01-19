import express from 'express';
import multer from 'multer';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import { downloadDbBackup, restoreDbFromUpload } from '../controllers/maintenanceController.js';

const router = express.Router();
const upload = multer({ dest: 'tmp-uploads' });

router.get('/db-backup', authMiddleware, adminMiddleware, downloadDbBackup);
router.post('/db-restore', authMiddleware, adminMiddleware, upload.single('backup'), restoreDbFromUpload);

export default router;