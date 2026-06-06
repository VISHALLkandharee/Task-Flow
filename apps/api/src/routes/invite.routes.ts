import { Router } from 'express';
import {
  sendInvite,
  getInvite,
  acceptInvite,
  getWorkspaceInvites,
} from '../controllers/invite.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

// Public — no auth needed to view invite details
router.get('/:token', getInvite);

// Protected
router.use(protectUser);
router.post('/', sendInvite);
router.post('/:token/accept', acceptInvite);
router.get('/', getWorkspaceInvites);

export default router;