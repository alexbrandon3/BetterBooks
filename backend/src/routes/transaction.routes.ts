import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionById,
} from "../controllers/transaction.controller";

const router = Router();

router.post("/", authenticate, createTransaction);
router.get("/", authenticate, getTransactions);
router.get("/:id", authenticate, getTransactionById);
router.put("/:id", authenticate, updateTransaction);
router.delete("/:id", authenticate, deleteTransaction);
// router.get("/account/:accountId", getTransactionsByAccountId);

export default router;
