import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { listEvaluations } from '../services/evaluationService';
import { listFiles } from '../services/storageService';
import { trainingService } from '../services/trainingService';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const [jobs, files, evaluations] = await Promise.all([
      trainingService.listJobs(req.user!.id),
      listFiles(req.user!.id),
      listEvaluations(req.user!.id)
    ]);

    res.json({ jobs, files, evaluations });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to load history' });
  }
});

export default router;
