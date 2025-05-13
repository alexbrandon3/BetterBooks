// report.routes.ts

import { Router } from "express";
import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getOperatingActivities,
  getInvestingActivities,
  getFinancingActivities,
} from "../controllers/report.controller";

const router = Router();

router.get("/income-statement", getIncomeStatement);
router.get("/balance-sheet", getBalanceSheet);
router.get("/cash-flow-statement", getCashFlowStatement);
router.get("/cash-flow-statement/operating", getOperatingActivities);
router.get("/cash-flow-statement/investing", getInvestingActivities);
router.get("/cash-flow-statement/financing", getFinancingActivities);

export default router;
