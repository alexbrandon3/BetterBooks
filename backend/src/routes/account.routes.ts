import express from "express";
import { authenticate } from "../middleware/auth";
import { AccountController } from "../controllers/account.controller";

const router = express.Router();
const accountController = new AccountController();

// Protected routes
router.use(authenticate);

// Account routes
router.get("/", accountController.getAccounts.bind(accountController));
router.get("/recalculated", accountController.getAccountsWithRecalculatedBalances.bind(accountController));
router.post("/", accountController.createAccount.bind(accountController));
router.put("/:id", accountController.updateAccount.bind(accountController));
router.delete("/:id", accountController.deleteAccount.bind(accountController));

// Enhanced suggestion and template routes
router.post("/suggest-account", accountController.suggestAccount.bind(accountController));
router.post("/suggest-metadata", accountController.suggestAccountAutoCategory.bind(accountController));
router.get("/templates", accountController.getAccountTemplates.bind(accountController));

export default router; 