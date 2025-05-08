import { Router, Request, Response } from "express";
import {
  createTransaction,
  getTransactions,
  deleteTransaction,
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

const router = Router();

// Transaction Routes
router.post("/transactions", (req: Request, res: Response) => {
  createTransaction(req, res).catch((err) => {
    console.error("Error in createTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/transactions", (req: Request, res: Response) => {
  getTransactions(req, res).catch((err) => {
    console.error("Error in getTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/transactions/:id", (req: Request, res: Response) => {
  deleteTransaction(req, res).catch((err) => {
    console.error("Error in deleteTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Recurring Transaction Routes
router.post("/recurring-transactions", (req: Request, res: Response) => {
  createRecurringTransaction(req, res).catch((err) => {
    console.error("Error in createRecurringTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/recurring-transactions", (req: Request, res: Response) => {
  getRecurringTransactions(req, res).catch((err) => {
    console.error("Error in getRecurringTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/recurring-transactions/:id", (req: Request, res: Response) => {
  deleteRecurringTransaction(req, res).catch((err) => {
    console.error("Error in deleteRecurringTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Split Transaction Routes
router.post("/split-transactions", (req: Request, res: Response) => {
  createSplitTransaction(req, res).catch((err) => {
    console.error("Error in createSplitTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/split-transactions", (req: Request, res: Response) => {
  getSplitTransactions(req, res).catch((err) => {
    console.error("Error in getSplitTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/split-transactions/:id", (req: Request, res: Response) => {
  deleteSplitTransaction(req, res).catch((err) => {
    console.error("Error in deleteSplitTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

export default router;
