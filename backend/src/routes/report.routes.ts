import { Router } from 'express';
import { getIncomeStatement } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate); // <-- must be here

router.get('/income-statement', getIncomeStatement);

export default router;
