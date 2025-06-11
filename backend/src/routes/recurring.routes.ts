import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getRecurringTransactions } from "../controllers/recurring.controller";
import { wrapAsync } from "../utils/wrap";

const router = express.Router();

router.get(
  "/",
  authenticate,
  wrapAsync(getRecurringTransactions)
);

export default router; 