import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import trainingRoutes from './routes/trainingRoutes';
import ingestionRoutes from './routes/ingestionRoutes';
import fileRoutes from './routes/fileRoutes';
import authRoutes from './routes/authRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import historyRoutes from './routes/historyRoutes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'training-studio-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/training', trainingRoutes);
  app.use('/api/ingestions', ingestionRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/history', historyRoutes);

  return app;
}
