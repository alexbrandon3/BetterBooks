// routes.ts

import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  deleteTransaction,
} from "../controllers/transaction.controller";
import {
  createRecurringTransaction,
  getRecurringTransactions,
  deleteRecurringTransaction,
} from "../controllers/recurringTransaction.controller";
import {
  createSplitTransaction,
  getSplitTransactions,
  deleteSplitTransaction,
} from "../controllers/splitTransaction.controller";

const router = Router();

// Transaction Routes
router.post("/transactions", createTransaction);
router.get("/transactions", getTransactions);
router.delete("/transactions/:id", deleteTransaction);

// Recurring Transaction Routes
router.post("/recurring-transactions", createRecurringTransaction);
router.get("/recurring-transactions", getRecurringTransactions);
router.delete("/recurring-transactions/:id", deleteRecurringTransaction);

// Split Transaction Routes
router.post("/split-transactions", createSplitTransaction);
router.get("/split-transactions", getSplitTransactions);
router.delete("/split-transactions/:id", deleteSplitTransaction);

export default router;
