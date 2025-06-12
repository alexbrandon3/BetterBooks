import express from 'express';
import { getSmartGoalSuggestions } from '../controllers/suggestionController';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Re-enable authentication middleware
router.get('/', authenticate, getSmartGoalSuggestions);

export default router; 