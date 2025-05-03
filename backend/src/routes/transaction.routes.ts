import express from "express";
import {
  createTransaction,
  getTransactions,
  deleteTransaction,
  getTransactionsByAccountId,
} from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

// ✅ Protect all routes with authenticate
router.use(authenticate);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.delete("/:id", deleteTransaction);
router.get("/account/:accountId", getTransactionsByAccountId);

export default router;
