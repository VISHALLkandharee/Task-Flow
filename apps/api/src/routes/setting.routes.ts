import { Router } from 'express';
import {
  updateProfile,
  changePassword,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/setting.controller';
import protectUser from '../middlewares/Protect_User';

const router = Router();

router.use(protectUser);

router.patch('/profile', updateProfile);
router.patch('/password', changePassword);
router.patch('/workspace', updateWorkspace);
router.delete('/workspace', deleteWorkspace);

export default router;