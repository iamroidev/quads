import { Router } from 'express';
import { runAutoPayouts, verifyAutoPayouts } from '../controllers/autoPayout.controller';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/roleCheck';

const router = Router();

router.post('/run', authenticate, isAdmin, runAutoPayouts);
router.post('/verify', authenticate, isAdmin, verifyAutoPayouts);

export default router;