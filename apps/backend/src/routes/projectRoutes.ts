import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/authMiddleware';
import { createProject, deleteProject, listProjects, ProjectServiceError } from '../services/projectService';
import { deleteFilesForProject } from '../services/storageService';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const projects = await listProjects(req.user!.id);
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to list projects' });
  }
});

router.post('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(3).max(80)
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', error: parsed.error.flatten() });
  }

  try {
    const project = await createProject(req.user!.id, parsed.data.name);
    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof ProjectServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to create project' });
  }
});

router.delete('/:projectId', async (req, res) => {
  const schema = z.object({
    projectId: z.string().min(1)
  });
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid project id' });
  }
  try {
    await deleteFilesForProject(req.user!.id, parsed.data.projectId);
    const project = await deleteProject(req.user!.id, parsed.data.projectId);
    res.json({ project });
  } catch (error) {
    if (error instanceof ProjectServiceError) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: error instanceof Error ? error.message : 'Unable to delete project' });
  }
});

export default router;
