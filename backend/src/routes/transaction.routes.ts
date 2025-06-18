import { Router } from "express";
import { TransactionController } from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth";
import { AuthenticatedRequest } from "../types/express";

const router = Router();
const transactionController = new TransactionController();

// Protected routes
router.get("/", authenticate, (req, res) => transactionController.getTransactions(req as AuthenticatedRequest, res));
router.post("/", authenticate, (req, res) => transactionController.createTransaction(req as AuthenticatedRequest, res));
router.put("/:id", authenticate, (req, res) => transactionController.updateTransaction(req as AuthenticatedRequest, res));
router.delete("/:id", authenticate, (req, res) => transactionController.deleteTransaction(req as AuthenticatedRequest, res));
router.get("/suggest-account", authenticate, (req, res) => transactionController.suggestAccount(req as AuthenticatedRequest, res));
router.get("/recurring", authenticate, (req, res) => transactionController.getRecurringTransactions(req as AuthenticatedRequest, res));

export default router;
