// src/routes/recurring.routes.ts
import { Router } from 'express';
import { previewRecurringTransactions } from '../controllers/recurring.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/preview', authenticate, previewRecurringTransactions);

export default router;
