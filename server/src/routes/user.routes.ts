import { Router } from 'express';
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  getUserStats,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/user/:userId/followers — get user's followers
router.get('/:userId/followers', getFollowers);

// GET /api/user/:userId/following — get who user is following
router.get('/:userId/following', getFollowing);

// GET /api/user/:userId/stats — get user statistics
router.get('/:userId/stats', getUserStats);

// POST /api/user/follow/:userId — toggle follow/unfollow
router.post('/follow/:userId', toggleFollow);

export default router;