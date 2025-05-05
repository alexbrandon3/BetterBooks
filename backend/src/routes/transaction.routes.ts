// src/routes/transaction.routes.ts
import express from "express";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionsByAccountId,
} from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.use(authenticate);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction); // ✅ Re-add this line
router.delete("/:id", deleteTransaction);
router.get("/account/:accountId", getTransactionsByAccountId);

export default router;
