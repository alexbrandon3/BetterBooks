import { Router } from 'express';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import authRoutes from './auth.routes';

const router = Router();

router.use('/api/accounts', accountRoutes);
router.use('/api/transactions', transactionRoutes);
router.use('/api/auth', authRoutes);

export default router;
