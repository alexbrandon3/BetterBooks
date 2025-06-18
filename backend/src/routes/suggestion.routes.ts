import express from 'express';
import { getSmartGoalSuggestions } from '../controllers/suggestionController';
import { SuggestionController } from '../controllers/suggestionController';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();
const suggestionController = new SuggestionController();

// Re-enable authentication middleware
router.get('/', authenticate, getSmartGoalSuggestions);

// Add the new suggest-account route
router.post('/suggest-account', authenticate, suggestionController.suggestAccount.bind(suggestionController));

export default router; 