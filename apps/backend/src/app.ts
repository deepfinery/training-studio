import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import trainingRoutes, { trainingWebhookRouter } from './routes/trainingRoutes';
import ingestionRoutes from './routes/ingestionRoutes';
import fileRoutes from './routes/fileRoutes';
import authRoutes from './routes/authRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import historyRoutes from './routes/historyRoutes';
import profileRoutes from './routes/profileRoutes';
import clusterRoutes from './routes/clusterRoutes';
import billingRoutes from './routes/billingRoutes';
import orgRoutes from './routes/orgRoutes';
import projectRoutes from './routes/projectRoutes';
import resultRoutes from './routes/resultRoutes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'training-studio-backend' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/training', trainingWebhookRouter);
  app.use('/api/training', trainingRoutes);
  app.use('/api/org', orgRoutes);
  app.use('/api/clusters', clusterRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/ingestions', ingestionRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/results', resultRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/history', historyRoutes);

  return app;
}
