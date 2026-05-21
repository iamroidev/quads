import { Router } from 'express';
import {
  getPayouts,
  getPayoutStats,
  processPayout,
  verifyPayoutStatus,
  getSellerPayouts,
  retryPayout,
} from '../controllers/payout.controller';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/roleCheck';

const router = Router();

// Authenticated user routes
router.get('/seller', authenticate, getSellerPayouts);
router.post('/:id/retry', authenticate, retryPayout);

// Admin-only routes
router.get('/', authenticate, isAdmin, getPayouts);
router.get('/stats', authenticate, isAdmin, getPayoutStats);
router.post('/:id/process', authenticate, isAdmin, processPayout);
router.post('/:id/verify', authenticate, isAdmin, verifyPayoutStatus);

export default router;