import { Router } from 'express';
import {
  getNotifications,
  markAllRead,
  markOneRead,
  clearAll,
} from '../controllers/notification.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markOneRead);
router.delete('/', clearAll);

export default router;