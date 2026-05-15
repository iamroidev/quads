import { Router } from 'express';
import * as offerController from '../controllers/offer.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', offerController.createOffer);
router.patch('/:offerId/respond', offerController.respondToOffer);

export default router;
