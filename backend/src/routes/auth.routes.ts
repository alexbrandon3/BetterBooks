import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate, schemas } from '../middleware/validate';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

router.post('/login', validate(schemas.login), authController.login.bind(authController));
router.post('/register', validate(schemas.register), authController.register.bind(authController));
router.get('/me', authenticate, authController.getMe.bind(authController));

export default router; 