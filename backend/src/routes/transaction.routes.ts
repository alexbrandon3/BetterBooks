import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  suggestAccount,
} from "../controllers/transaction.controller";

const router = express.Router();

router.get("/", authenticate, getTransactions);
router.post("/", authenticate, createTransaction);
router.put("/:id", authenticate, updateTransaction);
router.delete("/:id", authenticate, deleteTransaction);
router.post("/suggest-account", authenticate, suggestAccount);

export default router;
