import express from 'express';
import { getIncomeStatement } from '../controllers/report.controller';

const router = express.Router();

router.get('/income-statement', getIncomeStatement); // ← No cast here

export default router;
