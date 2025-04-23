import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  updateAccount,
  deleteAccount
} from '../controllers/account.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All routes below require authentication
router.use(authenticate);

router.post('/', createAccount);
router.get('/', getAccounts);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;