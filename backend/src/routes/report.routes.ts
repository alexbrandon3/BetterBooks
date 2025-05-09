// report.routes.ts

import { Router } from "express";
import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
} from "../controllers/report.controller";

const router = Router();

router.get("/income-statement", getIncomeStatement);
router.get("/balance-sheet", getBalanceSheet);
router.get("/cash-flow-statement", getCashFlowStatement);

export default router;
