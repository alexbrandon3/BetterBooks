import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth";
import { AuthenticatedRequest } from "../types/express";

const router = Router();
const transactionController = new TransactionController();

// Protected routes
router.get("/", authenticate, (req, res) => transactionController.getTransactions(req as AuthenticatedRequest, res));
router.get("/recent", authenticate, (req, res) => transactionController.getRecentTransactions(req as AuthenticatedRequest, res));
router.get("/balances", authenticate, (req, res) => transactionController.getAccountBalances(req as AuthenticatedRequest, res));
router.post("/", authenticate, (req, res) => transactionController.createTransaction(req as AuthenticatedRequest, res));
router.put("/:id", authenticate, (req, res) => transactionController.updateTransaction(req as AuthenticatedRequest, res));
router.patch("/:id", authenticate, (req, res) => transactionController.updateTransactionPartial(req as AuthenticatedRequest, res));
router.delete("/:id", authenticate, (req, res) => transactionController.deleteTransaction(req as AuthenticatedRequest, res));
router.post("/suggest-account", authenticate, (req, res) => transactionController.suggestAccount(req as AuthenticatedRequest, res));
router.get("/recurring", authenticate, (req, res) => transactionController.getRecurringTransactions(req as AuthenticatedRequest, res));
router.get("/templates", authenticate, (req, res) => transactionController.getTransactionTemplates(req as AuthenticatedRequest, res));
router.post("/templates", authenticate, (req, res) => transactionController.createTransactionTemplate(req as AuthenticatedRequest, res));
router.delete("/templates/:id", authenticate, (req, res) => transactionController.deleteTransactionTemplate(req as AuthenticatedRequest, res));
router.post("/suggest-template", authenticate, (req, res) => transactionController.suggestTransactionTemplate(req as AuthenticatedRequest, res));
router.post("/validate-template", authenticate, (req, res) => transactionController.validateTransactionTemplate(req as AuthenticatedRequest, res));
router.get("/categories", authenticate, (req, res) => transactionController.getUniqueCategories(req as AuthenticatedRequest, res));
router.post("/export", authenticate, (req, res) => transactionController.exportTransactions(req as AuthenticatedRequest, res));
router.post("/financial-summary", authenticate, (req, res) => transactionController.generateFinancialSummary(req as AuthenticatedRequest, res));

export default router;
