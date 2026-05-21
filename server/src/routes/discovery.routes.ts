import { Router } from 'express';
import {
  getRecentlyViewed,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  toggleSavedSearchAlert,
} from '../controllers/discovery.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All discovery routes are authenticated
router.use(authenticate);

// GET /api/discovery/recently-viewed — user's recently viewed products
router.get('/recently-viewed', getRecentlyViewed);

// POST /api/discovery/saved-searches — save a search query + filters
router.post('/saved-searches', saveSearch);

// GET /api/discovery/saved-searches — list saved searches
router.get('/saved-searches', getSavedSearches);

// DELETE /api/discovery/saved-searches/:id — remove saved search
router.delete('/saved-searches/:id', deleteSavedSearch);

// PATCH /api/discovery/saved-searches/:id/alert — toggle alerts
router.patch('/saved-searches/:id/alert', toggleSavedSearchAlert);

export default router;
