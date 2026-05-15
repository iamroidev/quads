import { Router } from 'express';
import authRoutes from './auth.routes';
import categoryRoutes from './category.routes';
import productRoutes from './product.routes';
import chatRoutes from './chat.routes';
import orderRoutes from './order.routes';
import paymentRoutes from './payment.routes';
import reviewRoutes from './review.routes';
import savedItemRoutes from './savedItem.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';
import disputeRoutes from './dispute.routes';
import growthRoutes from './growth.routes';
import verificationRoutes from './verification.routes';
import payoutRoutes from './payout.routes';
import autoPayoutRoutes from './autoPayout.routes';
import supportRoutes from './support.routes';
import feedRoutes from './feed.routes';
import offerRoutes from './offer.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'QUADS API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/conversations', chatRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/saved', savedItemRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/disputes', disputeRoutes);
router.use('/growth', growthRoutes);
router.use('/verification', verificationRoutes);
router.use('/payouts', payoutRoutes);
router.use('/auto-payouts', autoPayoutRoutes);
router.use('/support', supportRoutes);
router.use('/feed', feedRoutes);
router.use('/offers', offerRoutes);

export default router;