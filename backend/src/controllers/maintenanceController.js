import fs from 'fs';
import path from 'path';
import { AppError } from '../middleware/errorHandler.js';

// Genera y devuelve una copia del dev.db (SQLite) como descarga
export const downloadDbBackup = async (req, res, next) => {
  try {
    const dbPath = path.resolve('prisma', 'dev.db');

    if (!fs.existsSync(dbPath)) {
      throw new AppError('No se encontró la base de datos local', 404);
    }

    const backupsDir = path.resolve('backups');
    await fs.promises.mkdir(backupsDir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];
    const backupName = `dev_${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupName);

    await fs.promises.copyFile(dbPath, backupPath);

    res.setHeader('Content-Disposition', `attachment; filename="${backupName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    const stream = fs.createReadStream(backupPath);
    stream.on('error', next);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

export const restoreDbFromUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No se recibió el archivo de backup (campo "backup")', 400);
    }

    const dbPath = path.resolve('prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      throw new AppError('No se encontró la base de datos local', 404);
    }

    const backupsDir = path.resolve('backups');
    await fs.promises.mkdir(backupsDir, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '_')
      .split('.')[0];

    // Respaldo del estado actual antes de sobrescribir
    const safetyCopy = path.join(backupsDir, `dev_before_restore_${timestamp}.db`);
    await fs.promises.copyFile(dbPath, safetyCopy);

    // Sobrescribir con el backup recibido
    await fs.promises.copyFile(req.file.path, dbPath);

    // Limpieza del archivo temporal
    fs.promises.unlink(req.file.path).catch(() => {});

    res.json({ success: true, message: 'Base de datos restaurada. Reinicia el backend para que tome efecto.' });
  } catch (error) {
    next(error);
  }
};