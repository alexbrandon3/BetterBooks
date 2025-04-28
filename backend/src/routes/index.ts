import { Router } from 'express';
import accountRoutes from './account.routes';
import transactionRoutes from './transaction.routes';
import authRoutes from './auth.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/auth', authRoutes);
router.use('/reports', reportRoutes);

export default router;
