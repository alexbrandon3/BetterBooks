import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount
} from '../controllers/account.controller';
import { authenticate } from '../middleware/auth.middleware'; // ✅ Corrected import

const router = Router();

// All routes below require authentication
router.use(authenticate);

// RESTful Account Management
router.post('/', createAccount);    // Create new account
router.get('/', getAccounts);        // List user's accounts
router.put('/:id', updateAccount);   // Update specific account
router.delete('/:id', deleteAccount); // Delete specific account

export default router;
