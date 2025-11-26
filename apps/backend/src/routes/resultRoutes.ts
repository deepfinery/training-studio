import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { listTrainingResults } from '../services/storageService';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : null;
  if (!projectId) {
    return res.status(400).json({ message: 'projectId query parameter is required' });
  }

  try {
    const files = await listTrainingResults(req.user!.id, projectId);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to list results' });
  }
});

export default router;
