import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all transaction routes
router.use(authMiddleware);

// Create a new transaction
router.post('/', TransactionController.create);

// Get all transactions
router.get('/', TransactionController.getAll);

// Get transaction by ID
router.get('/:id', TransactionController.getById);

export default router; 