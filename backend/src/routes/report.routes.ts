import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getIncomeStatement,
  getBalanceSheet,
} from "../controllers/report.controller";

const router = Router();

// Report Routes
router.get("/income-statement", authenticate, getIncomeStatement);
router.get("/balance-sheet", authenticate, getBalanceSheet);

export default router;
