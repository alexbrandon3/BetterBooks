import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { wrapAsync } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../types/express";
import {
  createAccount,
  getAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
  suggestAccountMetadata,
  suggestAccountAutoCategory,
} from "../controllers/account.controller";

const router = express.Router();

router.post("/", authenticate, wrapAsync<AuthenticatedRequest>(createAccount));
router.get("/", authenticate, wrapAsync<AuthenticatedRequest>(getAccounts));
router.get("/:id", authenticate, wrapAsync<AuthenticatedRequest>(getAccountById));
router.put("/:id", authenticate, wrapAsync<AuthenticatedRequest>(updateAccount));
router.delete("/:id", authenticate, wrapAsync<AuthenticatedRequest>(deleteAccount));
router.post("/suggest-metadata", authenticate, wrapAsync<AuthenticatedRequest>(suggestAccountMetadata));
router.post("/suggest-account", authenticate, wrapAsync<AuthenticatedRequest>(suggestAccountAutoCategory));

export default router; 