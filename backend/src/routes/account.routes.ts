import express from "express";
import { authenticate } from "../middleware/auth.middleware";
import { wrapAsync } from "../utils/asyncHandler";
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

router.post("/", authenticate, wrapAsync(createAccount));
router.get("/", authenticate, wrapAsync(getAccounts));
router.get("/:id", authenticate, wrapAsync(getAccountById));
router.put("/:id", authenticate, wrapAsync(updateAccount));
router.delete("/:id", authenticate, wrapAsync(deleteAccount));
router.post("/suggest-metadata", authenticate, wrapAsync(suggestAccountMetadata));
router.post("/suggest-account", authenticate, wrapAsync(suggestAccountAutoCategory));

export default router; 