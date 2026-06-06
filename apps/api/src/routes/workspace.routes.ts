import { Router } from 'express';
import { createWorkspace } from '../controllers/workspace.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);
router.post('/', createWorkspace);

export default router;