import express from 'express';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionsByAccountId
} from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware'; // ✅ Correct import path

const router = express.Router();

// ✅ Protect all routes with authenticate
router.use(authenticate);

router.post('/', createTransaction);
router.get('/', getTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);
router.get('/account/:accountId', getTransactionsByAccountId); // ✅ Cleaner: no need to reauthenticate

export default router;
