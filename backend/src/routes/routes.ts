import { Router, Request, Response } from "express";
import { loginUser, registerUser } from "../controllers/user.controller";
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
import {
  createAccount,
  getAccounts,
  deleteAccount,
} from "../controllers/account.controller";

const router = Router();

// Auth Routes
router.post("/auth/login", (req: Request, res: Response) => {
  loginUser(req, res).catch((err) => {
    console.error("Error in loginUser:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.post("/auth/register", (req: Request, res: Response) => {
  registerUser(req, res).catch((err) => {
    console.error("Error in registerUser:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Account Routes
router.post("/accounts", (req, res) => {
  createAccount(req, res).catch((err) => {
    console.error("Error in createAccount:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/accounts", (req, res) => {
  getAccounts(req, res).catch((err) => {
    console.error("Error in getAccounts:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/accounts/:id", (req, res) => {
  deleteAccount(req, res).catch((err) => {
    console.error("Error in deleteAccount:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Transaction Routes
router.post("/transactions", (req, res) => {
  createTransaction(req, res).catch((err) => {
    console.error("Error in createTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/transactions", (req, res) => {
  getTransactions(req, res).catch((err) => {
    console.error("Error in getTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/transactions/:id", (req, res) => {
  deleteTransaction(req, res).catch((err) => {
    console.error("Error in deleteTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Recurring Transaction Routes
router.post("/recurring-transactions", (req, res) => {
  createRecurringTransaction(req, res).catch((err) => {
    console.error("Error in createRecurringTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/recurring-transactions", (req, res) => {
  getRecurringTransactions(req, res).catch((err) => {
    console.error("Error in getRecurringTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/recurring-transactions/:id", (req, res) => {
  deleteRecurringTransaction(req, res).catch((err) => {
    console.error("Error in deleteRecurringTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Split Transaction Routes
router.post("/split-transactions", (req, res) => {
  createSplitTransaction(req, res).catch((err) => {
    console.error("Error in createSplitTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/split-transactions", (req, res) => {
  getSplitTransactions(req, res).catch((err) => {
    console.error("Error in getSplitTransactions:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/split-transactions/:id", (req, res) => {
  deleteSplitTransaction(req, res).catch((err) => {
    console.error("Error in deleteSplitTransaction:", err);
    res.status(500).send("Internal Server Error");
  });
});

export default router;
