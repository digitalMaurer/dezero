import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import oposicionesRoutes from './routes/oposiciones.js';
import temasRoutes from './routes/temas.js';
import preguntasRoutes from './routes/preguntas.js';
import testsRoutes from './routes/tests.js';
import reportsRoutes from './routes/reports.js';
import ankiRoutes from './routes/anki.js';
import maintenanceRoutes from './routes/maintenance.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Logger middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/oposiciones', oposicionesRoutes);
app.use('/api/v1/temas', temasRoutes);
app.use('/api/v1/preguntas', preguntasRoutes);
app.use('/api/v1/tests', testsRoutes);
app.use('/api/v1', reportsRoutes);
app.use('/api/v1/anki', ankiRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada' 
  });
});

const PORT = process.env.PORT || 4100;

app.listen(PORT, () => {
  logger.info(`✅ Servidor corriendo en puerto ${PORT}`);
  logger.info(`📝 Documentación: http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('⛔ Cerrando servidor...');
  await prisma.$disconnect();
  process.exit(0);
});
