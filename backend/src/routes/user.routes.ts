import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/user.controller';

const router = Router();

// @route   POST /api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/users/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', loginUser);

export default router;