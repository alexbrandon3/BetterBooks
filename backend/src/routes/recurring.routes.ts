import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { 
  getRecurringTransactions, 
  createRecurringTransaction, 
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransaction
} from "../controllers/recurring.controller";
import { wrapAsync } from "../utils/wrap";
import { validate, schemas } from "../utils/validation";

const router = express.Router();

router.get(
  "/",
  authenticate,
  wrapAsync(getRecurringTransactions)
);

router.post(
  "/",
  authenticate,
  validate(schemas.createRecurringTransaction),
  wrapAsync(createRecurringTransaction)
);

router.put(
  "/:id",
  authenticate,
  validate(schemas.createRecurringTransaction),
  wrapAsync(updateRecurringTransaction)
);

router.delete(
  "/:id",
  authenticate,
  wrapAsync(deleteRecurringTransaction)
);

router.patch(
  "/:id/toggle",
  authenticate,
  wrapAsync(toggleRecurringTransaction)
);

export default router; 