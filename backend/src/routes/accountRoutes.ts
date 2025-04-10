import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  createAccount,
  getAccounts,
  getAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/accountController';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', createAccount);
router.get('/', getAccounts);
router.get('/:id', getAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router; 