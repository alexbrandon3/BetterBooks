import { Router } from "express";
import {
  getBalanceSheet,
  getIncomeStatement,
  getCashFlow,
} from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { AuthenticatedRequest } from "../types/express";

const router = Router();

router.get("/balance-sheet", authenticate, (req, res) => getBalanceSheet(req as AuthenticatedRequest, res));
router.get("/income-statement", authenticate, (req, res) => getIncomeStatement(req as AuthenticatedRequest, res));
router.get("/cash-flow", authenticate, (req, res) => getCashFlow(req as AuthenticatedRequest, res));

export default router;
