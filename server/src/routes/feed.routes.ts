import { Router } from 'express';
import { getPulseFeed } from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Feed routes require authentication
router.use(authenticate);

// GET /api/feed/pulse — get pulse feed for authenticated user
router.get('/pulse', getPulseFeed);

export default router;