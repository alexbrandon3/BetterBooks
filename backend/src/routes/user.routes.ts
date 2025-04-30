import { Router } from 'express';
import { register, login } from '../controllers/user.controller';

const router = Router();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', register);

// @route   POST /api/users/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', login);

export default router;