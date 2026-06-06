import { Router } from 'express';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
} from '../controllers/billing.controller';
import  protectUser  from '../middlewares/Protect_User';

const router = Router();

// All billing routes are protected
router.use(protectUser);
router.get('/status', getBillingStatus);
router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);

export default router;