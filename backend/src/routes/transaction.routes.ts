import { Router } from "express";
import {
  createTransaction,
  // getTransactions,
  // updateTransaction,
  // deleteTransaction,
  // getTransactionsByAccountId
} from "../controllers/transaction.controller";

const router = Router();

router.post("/", createTransaction);
// router.get("/", getTransactions);
// router.put("/:id", updateTransaction);
// router.delete("/:id", deleteTransaction);
// router.get("/account/:accountId", getTransactionsByAccountId);

export default router;
