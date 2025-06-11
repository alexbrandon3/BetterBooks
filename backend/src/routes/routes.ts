import { Router } from "express";
import { loginUser, registerUser, getCurrentUser } from "../controllers/user.controller";
import {
  createTransaction,
  getTransactions,
  deleteTransaction,
  suggestAccount,
  updateTransaction,
} from "../controllers/transaction.controller";
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
import recurringRoutes from "./recurring.routes";

const router = Router();

// Auth Routes
router.post("/auth/login", validate(schemas.login), wrapAsync(loginUser));
router.post("/auth/register", validate(schemas.register), wrapAsync(registerUser));
router.get("/auth/me", authenticate, wrapAsync(getCurrentUser));

// Account Routes
router.use("/accounts", accountRoutes);

// Transaction Routes
router.post("/transactions", authenticate, validate(schemas.createTransaction), wrapAsync(createTransaction));
router.get("/transactions", authenticate, wrapAsync(getTransactions));
router.use("/transactions/recurring", recurringRoutes);
router.get("/transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(getTransactions));
router.put("/transactions/:id", authenticate, validateParams(schemas.idParam), validate(schemas.createTransaction), wrapAsync(updateTransaction));
router.delete("/transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(deleteTransaction));
router.post("/transactions/suggest-account", authenticate, validate(schemas.suggestAccount), wrapAsync(suggestAccount));

// Split Transaction Routes
router.post("/split-transactions", authenticate, validate(schemas.createSplitTransaction), wrapAsync(createSplitTransaction));
router.get("/split-transactions", authenticate, wrapAsync(getSplitTransactions));
router.delete("/split-transactions/:id", authenticate, validateParams(schemas.idParam), wrapAsync(deleteSplitTransaction));

// Report Routes
router.get("/reports/income-statement", authenticate, validateQuery(schemas.dateRange), wrapAsync(getIncomeStatement));
router.get("/reports/balance-sheet", authenticate, validateQuery(schemas.dateRange), wrapAsync(getBalanceSheet));

export default router;
