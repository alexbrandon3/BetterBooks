import { Router, Request, Response } from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
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
import { registerUser, loginUser } from "../controllers/user.controller";
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "../controllers/account.controller";

import reportRoutes from "./report.routes";

const router = Router();

// User Routes
router.post("/users/register", (req: Request, res: Response) => {
  registerUser(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.post("/users/login", (req: Request, res: Response) => {
  loginUser(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Account Routes
router.post("/accounts", (req: Request, res: Response) => {
  createAccount(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/accounts", (req: Request, res: Response) => {
  getAccounts(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/accounts/:id", (req: Request, res: Response) => {
  getAccountById(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.put("/accounts/:id", (req: Request, res: Response) => {
  updateAccount(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/accounts/:id", (req: Request, res: Response) => {
  deleteAccount(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Transaction Routes
router.post("/transactions", (req: Request, res: Response) => {
  createTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/transactions", (req: Request, res: Response) => {
  getTransactions(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/transactions/:id", (req: Request, res: Response) => {
  console.log("🔥 Reached the transaction route with ID:", req.params.id);
  getTransactionById(req, res).catch((err: any) => {
    console.error("Error in getTransactionById:", err.message);
    res.status(500).send("Internal Server Error");
  });
});

router.put("/transactions/:id", (req: Request, res: Response) => {
  console.log("🔥 PUT /transactions/:id was hit!");
  updateTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/transactions/:id", (req: Request, res: Response) => {
  deleteTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Recurring Transaction Routes
router.post("/recurring-transactions", (req: Request, res: Response) => {
  createRecurringTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/recurring-transactions", (req: Request, res: Response) => {
  getRecurringTransactions(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/recurring-transactions/:id", (req: Request, res: Response) => {
  deleteRecurringTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

// Split Transaction Routes
router.post("/split-transactions", (req: Request, res: Response) => {
  createSplitTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.get("/split-transactions", (req: Request, res: Response) => {
  getSplitTransactions(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.delete("/split-transactions/:id", (req: Request, res: Response) => {
  deleteSplitTransaction(req, res).catch((err: any) => {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  });
});

router.use("/reports", reportRoutes);

export default router;
