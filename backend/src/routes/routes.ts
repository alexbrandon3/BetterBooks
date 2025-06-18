import express from "express";
import { authenticate } from "../middleware/auth";
import { AuthController } from "../controllers/auth.controller";

const router = express.Router();
const authController = new AuthController();

// Auth routes
router.post("/login", authController.login.bind(authController));
router.post("/register", authController.register.bind(authController));
router.get("/me", authenticate, authController.getMe.bind(authController));

export default router;
