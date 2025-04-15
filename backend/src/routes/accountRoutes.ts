import { Router } from 'express';
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/accountController';

const router = Router();

// Routes
router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router; 