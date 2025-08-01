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

// Add the save preference route
router.post('/save-preference', authenticate, suggestionController.saveUserPreference.bind(suggestionController));

// Add the save feedback route
router.post('/save-feedback', authenticate, suggestionController.saveSuggestionFeedback.bind(suggestionController));

// Add the suggest category route
router.post('/suggest-category', authenticate, suggestionController.suggestCategory.bind(suggestionController));

// Add the suggest transaction type route
router.post('/suggest-transaction-type', authenticate, suggestionController.suggestTransactionType.bind(suggestionController));

// Add routes for user preferences management
router.get('/preferences', authenticate, suggestionController.getUserPreferences.bind(suggestionController));
router.delete('/preferences', authenticate, suggestionController.clearUserPreferences.bind(suggestionController));

// Add routes for suggestion settings
router.get('/settings', authenticate, suggestionController.getSuggestionSettings.bind(suggestionController));
router.put('/settings', authenticate, suggestionController.updateSuggestionSettings.bind(suggestionController));

export default router; 