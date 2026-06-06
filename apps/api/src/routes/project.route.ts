import { Router } from 'express';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller';
import  protectUser  from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', createProject);
router.patch('/:id', updateProject);
router.delete('/:id', deleteProject);

export default router;