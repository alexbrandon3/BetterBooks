import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, schemas } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();
const authController = new AuthController();

// Apply rate limiting to sensitive authentication endpoints
router.post('/login', authRateLimiter, validate(schemas.login), authController.login.bind(authController));
router.post('/register', authRateLimiter, validate(schemas.register), authController.register.bind(authController));
router.get('/me', authenticate, authController.getMe.bind(authController));
router.put('/profile', authenticate, authController.updateProfile.bind(authController));

export default router; 