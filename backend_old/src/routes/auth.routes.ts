import { Router, Request, Response } from "express";
import { register, login } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, (req: Request, res: Response) => {
  return res.status(200).json(req.user);
});

export default router;

console.log("✅ Auth routes mounted at /api/auth");
