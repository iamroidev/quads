import { Router } from 'express';
import { getMyTransactions, getTransactionDetail } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/transactions/my — List buyer's transactions
router.get('/my', authenticate, getMyTransactions);

// GET /api/transactions/:id — Get details of a specific transaction
router.get('/:id', authenticate, getTransactionDetail);

export default router;
