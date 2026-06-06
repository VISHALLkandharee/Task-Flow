import {
  getTasks,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
  getMyTasks, // ← add this
} from '../controllers/task.controller';

import protectUser from '../middlewares/Protect_User';
import { Router } from 'express';

const router = Router();

router.use(protectUser);

router.get('/my-tasks', getMyTasks);
router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.delete('/:id', deleteTask);

export default router;