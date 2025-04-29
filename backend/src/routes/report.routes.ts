import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getIncomeStatement } from '../controllers/report.controller';

const router = Router();

// All report routes require authentication
router.use(authenticate);

router.get('/income-statement', getIncomeStatement);

export default router;
