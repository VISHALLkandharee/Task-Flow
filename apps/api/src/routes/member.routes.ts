import { Router } from 'express';
import {
  getMembers,
  updateMemberRole,
  removeMember,
} from '../controllers/member.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);

router.get('/', getMembers);
router.patch('/:id', updateMemberRole);
router.delete('/:id', removeMember);

export default router;