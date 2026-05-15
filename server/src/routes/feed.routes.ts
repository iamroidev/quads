import { Router } from 'express';
import { getPulseFeed } from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All feed routes are protected
router.use(authenticate);

router.get('/pulse', getPulseFeed);

export default router;
