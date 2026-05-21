import { Router } from 'express';
import {
  createBuyerRating,
  getBuyerRating,
  getOrderBuyerRating,
} from '../controllers/buyerRating.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected buyer-rating routes
router.post('/', authenticate, createBuyerRating);
router.get('/order/:orderId', authenticate, getOrderBuyerRating);

// Public average/list lookup
router.get('/:buyerId', getBuyerRating);

export default router;
