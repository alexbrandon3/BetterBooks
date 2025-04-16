import { Router } from 'express';
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  } from '../controllers/account.controller';
  import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);          // 🔐 all below require JWT
router.get('/', getAccounts);
router.post('/', createAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;