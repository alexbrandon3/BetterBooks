import { Router, Response } from "express";
import {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
} from "../controllers/report.controller";
import { authenticate, AuthedRequest } from "../middleware/auth.middleware";

const router = Router();

// Apply authentication middleware globally to this router
router.use(authenticate as unknown as (
  req: AuthedRequest,
  res: Response,
  next: () => void
) => void);

router.get("/income-statement", async (req: AuthedRequest, res: Response) => {
  try {
    await getIncomeStatement(req, res);
  } catch (err) {
    console.error("Income statement error:", err);
    res.status(500).send("Server error");
  }
});

router.get("/balance-sheet", async (req: AuthedRequest, res: Response) => {
  try {
    await getBalanceSheet(req, res);
  } catch (err) {
    console.error("Balance sheet error:", err);
    res.status(500).send("Server error");
  }
});

router.get("/cash-flow", async (req: AuthedRequest, res: Response) => {
  try {
    await getCashFlowStatement(req, res);
  } catch (err) {
    console.error("Cash flow statement error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
