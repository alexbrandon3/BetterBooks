import express from 'express';
import {
  getBalanceSheet,
  getIncomeStatement,
  getCashFlow,
  getDrillDown,
} from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";
import { reportRateLimiter } from "../middleware/rateLimiter";
import { AuthenticatedRequest } from "../types/express";

const router = express.Router();

// Apply rate limiting to report endpoints to prevent abuse
router.get("/balance-sheet", authenticate, reportRateLimiter, (req, res) => getBalanceSheet(req as AuthenticatedRequest, res));
router.get("/income-statement", authenticate, reportRateLimiter, (req, res) => getIncomeStatement(req as AuthenticatedRequest, res));
router.get("/cash-flow", authenticate, reportRateLimiter, (req, res) => getCashFlow(req as AuthenticatedRequest, res));
router.get("/drilldown", authenticate, reportRateLimiter, (req, res) => getDrillDown(req as AuthenticatedRequest, res));

export default router;
