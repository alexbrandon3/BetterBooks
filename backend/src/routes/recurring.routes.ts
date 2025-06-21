import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { 
  getRecurringTransactions, 
  createRecurringTransaction, 
  updateRecurringTransaction,
  deleteRecurringTransaction 
} from "../controllers/recurring.controller";
import { wrapAsync } from "../utils/wrap";

const router = express.Router();

router.get(
  "/",
  authenticate,
  wrapAsync(getRecurringTransactions)
);

router.post(
  "/",
  authenticate,
  wrapAsync(createRecurringTransaction)
);

router.put(
  "/:id",
  authenticate,
  wrapAsync(updateRecurringTransaction)
);

router.delete(
  "/:id",
  authenticate,
  wrapAsync(deleteRecurringTransaction)
);

export default router; 