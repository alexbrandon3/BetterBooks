import express from "express";
import { suggestAccount } from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/suggest-account", authenticate, suggestAccount);

export default router;
