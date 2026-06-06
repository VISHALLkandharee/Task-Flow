import { Router } from 'express';
import {
  getComments,
  createComment,
  deleteComment,
} from '../controllers/comment.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);

router.get('/', getComments);
router.post('/', createComment);
router.delete('/:id', deleteComment);

export default router;