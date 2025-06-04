import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller";
import {
  createTransaction,
  getTransactions,
  deleteTransaction,
  suggestAccount,
  getTransactionById,
  updateTransaction,
} from "../controllers/transaction.controller";
import {
  createRecurringTransaction,
  getRecurringTransactions,
  deleteRecurringTransaction,
} from "../controllers/recurringTransactions.controller";
import {
  createSplitTransaction,
  getSplitTransactions,
  deleteSplitTransaction,
} from "../controllers/splitTransaction.controller";
import {
  getIncomeStatement,
  getBalanceSheet,
} from "../controllers/report.controller";
import { validate, validateParams, validateQuery, schemas } from "../utils/validation";
import { wrapAsync } from "../utils/wrap";
import { authenticate } from "../middleware/auth.middleware";
import accountRoutes from "./account.routes";

const router = Router();

// Auth Routes
router.post("/auth/login", validate(schemas.login), wrapAsync(loginUser));
router.post("/auth/register", validate(schemas.register), wrapAsync(registerUser));

// Account Routes
router.use("/accounts", accountRoutes);

// Transaction Routes
router.post("/transactions", authenticate, validate(schemas.createTransaction), wrapAsync(createTransaction));
router.get("/transactions", authenticate, wrapAsync(getTransactions));
router.get("/transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(getTransactionById));
router.put("/transactions/:id", authenticate, validateParams(schemas.idParam), validate(schemas.createTransaction), wrapAsync(updateTransaction));
router.delete("/transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(deleteTransaction));
router.post("/transactions/suggest-account", authenticate, validate(schemas.suggestAccount), wrapAsync(suggestAccount));

// Recurring Transaction Routes
router.post("/recurring-transactions", authenticate, validate(schemas.createRecurringTransaction), wrapAsync(createRecurringTransaction));
router.get("/recurring-transactions", authenticate, wrapAsync(getRecurringTransactions));
router.delete("/recurring-transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(deleteRecurringTransaction));

// Split Transaction Routes
router.post("/split-transactions", authenticate, validate(schemas.createSplitTransaction), wrapAsync(createSplitTransaction));
router.get("/split-transactions", authenticate, wrapAsync(getSplitTransactions));
router.delete("/split-transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(deleteSplitTransaction));

// Report Routes
router.get("/reports/income-statement", authenticate, validateQuery(schemas.dateRange), wrapAsync(getIncomeStatement));
router.get("/reports/balance-sheet", authenticate, validateQuery(schemas.dateRange), wrapAsync(getBalanceSheet));

export default router;
