import { Request, Response } from 'express';
import { generateSuggestions } from '../services/suggestionEngine/generateSuggestions';
import { AccountService } from '../services/AccountService';
import { TransactionService } from '../services/TransactionService';
import { logAnalytics } from '../utils/analytics';
import { User } from '../entities/User';
import { AuthenticatedRequest } from '../types/express';
import { BaseController } from './base.controller';
import { SuggestionService } from '../services/suggestion.service';
import { AccountWeightService } from '../services/AccountWeightService';
import { AppDataSource } from '../config/data-source';

export const getSmartGoalSuggestions = async (req: Request, res: Response): Promise<void> => {
  console.log('🎯 Suggestions endpoint hit:', {
    path: req.path,
    method: req.method,
    query: req.query,
    headers: req.headers,
    url: req.url,
    originalUrl: req.originalUrl
  });

  // Ensure we always send JSON responses
  res.setHeader('Content-Type', 'application/json');

  try {
    const userId = req.user?.userId;
    if (!userId || !req.user) {
      throw new Error('User not authenticated');
    }

    console.log('🔍 Getting suggestions for user:', userId);

    // Get the actual user entity
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's financial data
    const accounts = await AccountService.getAccounts(userId.toString());
    const transactionResult = await TransactionService.fetchTransactions(userId.toString());
    const transactions = transactionResult.transactions; // Extract the transactions array

    console.log('📊 Found accounts:', accounts.length);
    console.log('📊 Found transactions:', transactions.length);

    // Generate suggestions
    const suggestions = await generateSuggestions(user, accounts, transactions);
    console.log('📊 Generated suggestions:', suggestions);

    // Log suggestion view
    await logAnalytics('suggestion_viewed', {
      user_id: userId,
      suggestion_count: suggestions.length
    });

    res.status(200).json(suggestions);
  } catch (error) {
    console.error('❌ Error in getSmartGoalSuggestions:', error);
    res.status(500).json({ 
      error: 'Failed to get goal suggestions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export class SuggestionController extends BaseController {
  private suggestionService: SuggestionService;
  private accountWeightService: AccountWeightService;

  constructor() {
    super();
    this.suggestionService = new SuggestionService();
    this.accountWeightService = new AccountWeightService();
  }

  async getSuggestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const suggestions = await this.suggestionService.getSuggestions(req.user.userId);
      this.sendResponse(res, 200, suggestions);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async createSuggestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const suggestion = await this.suggestionService.createSuggestion({
        ...req.body,
        userId: req.user.userId
      });
      this.sendResponse(res, 201, suggestion);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async updateSuggestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const suggestion = await this.suggestionService.updateSuggestion(
        req.params.id,
        req.user.userId,
        req.body
      );
      this.sendResponse(res, 200, suggestion);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async deleteSuggestion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await this.suggestionService.deleteSuggestion(req.params.id, req.user.userId);
      this.sendResponse(res, 204, null);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async suggestAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 Transaction suggestion request:', {
        body: req.body,
        userId: req.user.userId
      });
      
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        console.log('❌ Invalid description:', description);
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      const userId = req.user.userId;
      console.log('🔍 Getting suggestion for description:', description, 'userId:', userId);
      
      const suggestion = await this.suggestionService.suggestAccountForDescription(description, userId);
      
      console.log('✅ Suggestion result:', suggestion);
      
      this.sendResponse(res, 200, suggestion);
    } catch (error) {
      console.error('❌ Error in suggestAccount:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async saveUserPreference(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('💾 Save user preference request:', {
        body: req.body,
        userId: req.user.userId
      });
      
      const { description, accountId } = req.body;
      
      if (!description || typeof description !== 'string') {
        console.log('❌ Invalid description:', description);
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      if (!accountId || typeof accountId !== 'number') {
        console.log('❌ Invalid accountId:', accountId);
        this.sendError(res, 400, 'AccountId is required and must be a number');
        return;
      }

      const userId = req.user.userId;
      console.log('💾 Saving preference for description:', description, 'accountId:', accountId, 'userId:', userId);
      
      await this.suggestionService.saveUserPreference(description, accountId, userId);
      
      console.log('✅ Preference saved successfully');
      
      this.sendResponse(res, 200, { message: 'Preference saved successfully' });
    } catch (error) {
      console.error('❌ Error in saveUserPreference:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async saveSuggestionFeedback(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        this.sendResponse(res, 401, { error: 'Unauthorized' });
        return;
      }

      const {
        description,
        suggestedAccountId,
        suggestedAccountName,
        confidence,
        feedbackType,
        selectedAccountId,
        selectedAccountName,
        userReason,
        rejectionReason,
        suggestionMetadata,
        contextData
      } = req.body;

      // Validate required fields
      if (!description || !suggestedAccountId || !suggestedAccountName || !confidence || !feedbackType) {
        this.sendResponse(res, 400, { error: 'Missing required fields' });
        return;
      }

      // Validate feedback type
      if (!['ACCEPTED', 'REJECTED', 'IGNORED'].includes(feedbackType)) {
        this.sendResponse(res, 400, { error: 'Invalid feedback type' });
        return;
      }

      await this.suggestionService.saveSuggestionFeedback({
        userId,
        description,
        suggestedAccountId,
        suggestedAccountName,
        confidence,
        feedbackType,
        selectedAccountId,
        selectedAccountName,
        userReason,
        rejectionReason,
        suggestionMetadata,
        contextData
      });

      this.sendResponse(res, 200, { message: 'Feedback saved successfully' });
    } catch (error) {
      console.error('Error saving suggestion feedback:', error);
      this.sendResponse(res, 500, { error: 'Internal server error' });
    }
  }

  async suggestCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 Category suggestion request:', {
        body: req.body,
        userId: req.user.userId
      });
      
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        console.log('❌ Invalid description:', description);
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      const userId = req.user.userId;
      console.log('🔍 Getting category suggestion for description:', description, 'userId:', userId);
      
      const suggestion = await this.suggestionService.suggestCategoryForDescription(description);
      
      console.log('✅ Category suggestion result:', suggestion);
      
      this.sendResponse(res, 200, suggestion);
    } catch (error) {
      console.error('❌ Error in suggestCategory:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async suggestTransactionType(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 Transaction type suggestion request:', {
        body: req.body,
        userId: req.user.userId
      });
      
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        console.log('❌ Invalid description:', description);
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      const userId = req.user.userId;
      console.log('🔍 Getting transaction type suggestion for description:', description, 'userId:', userId);
      
      const suggestion = await this.suggestionService.suggestTransactionTypeForDescription(description, userId);
      
      console.log('✅ Transaction type suggestion result:', suggestion);
      
      this.sendResponse(res, 200, suggestion);
    } catch (error) {
      console.error('❌ Error in suggestTransactionType:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async getUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('📋 Getting user preferences for userId:', req.user.userId);
      
      const preferences = await this.suggestionService.getUserPreferences(req.user.userId);
      
      console.log('✅ User preferences retrieved:', preferences.length, 'preferences');
      
      this.sendResponse(res, 200, preferences);
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async clearUserPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🗑️ Clearing user preferences for userId:', req.user.userId);
      
      await this.suggestionService.clearUserPreferences(req.user.userId);
      
      console.log('✅ User preferences cleared successfully');
      
      this.sendResponse(res, 200, { message: 'Preferences cleared successfully' });
    } catch (error) {
      console.error('❌ Error clearing user preferences:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async getSuggestionSettings(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('⚙️ Getting suggestion settings');
      
      const settings = await this.suggestionService.getSuggestionSettings();
      
      console.log('✅ Suggestion settings retrieved:', settings);
      
      this.sendResponse(res, 200, settings);
    } catch (error) {
      console.error('❌ Error getting suggestion settings:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async updateSuggestionSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('⚙️ Updating suggestion settings:', req.body);
      
      await this.suggestionService.updateSuggestionSettings(req.body);
      
      console.log('✅ Suggestion settings updated successfully');
      
      this.sendResponse(res, 200, { message: 'Settings updated successfully' });
    } catch (error) {
      console.error('❌ Error updating suggestion settings:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async getUserWeights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('⚖️ Getting user weights for userId:', req.user.userId);
      
      const weights = await this.accountWeightService.getUserWeights(req.user.userId);
      
      console.log('✅ User weights retrieved:', weights.length, 'weights');
      
      this.sendResponse(res, 200, weights);
    } catch (error) {
      console.error('❌ Error getting user weights:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async createOrUpdateWeight(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('⚖️ Creating/updating weight:', req.body);
      
      const userId = req.user.userId;
      const { keyword, accountId, weight, transactionType, isDefault } = req.body;
      
      if (!keyword || !accountId || weight === undefined) {
        this.sendError(res, 400, 'Keyword, accountId, and weight are required');
        return;
      }

      if (weight < 0 || weight > 100) {
        this.sendError(res, 400, 'Weight must be between 0 and 100');
        return;
      }

      const weightData = await this.accountWeightService.createOrUpdateWeight(userId, {
        keyword: keyword.toLowerCase(),
        accountId,
        weight,
        transactionType,
        isDefault
      });
      
      console.log('✅ Weight created/updated successfully');
      
      this.sendResponse(res, 200, weightData);
    } catch (error) {
      console.error('❌ Error creating/updating weight:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async deleteWeight(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🗑️ Deleting weight:', req.params.id);
      
      const userId = req.user.userId;
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 400, 'Valid weight ID is required');
        return;
      }

      await this.accountWeightService.deleteWeight(Number(id), userId);
      
      console.log('✅ Weight deleted successfully');
      
      this.sendResponse(res, 200, { message: 'Weight deleted successfully' });
    } catch (error) {
      console.error('❌ Error deleting weight:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async initializeDefaultWeights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('⚖️ Initializing default weights for userId:', req.user.userId);
      
      await this.accountWeightService.initializeDefaultWeights(req.user.userId);
      
      console.log('✅ Default weights initialized successfully');
      
      this.sendResponse(res, 200, { message: 'Default weights initialized successfully' });
    } catch (error) {
      console.error('❌ Error initializing default weights:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async suggestDualSides(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 DUAL-SIDE API CALL START');
      console.log('📝 Request body:', req.body);
      console.log('👤 User ID:', req.user.userId);
      
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        console.log('❌ Invalid description:', description);
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      console.log('✅ Description is valid:', description);
      
      const userId = req.user.userId;
      console.log('🔍 Calling suggestDualSidesForDescription with:', { description, userId });
      
      const dualSuggestion = await this.suggestionService.suggestDualSidesForDescription(description, userId);
      
      console.log('📊 Dual suggestion result:', dualSuggestion);
      
      this.sendResponse(res, 200, dualSuggestion);
    } catch (error) {
      console.error('❌ Error in suggestDualSides:', error);
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }
}

export const getSuggestions = async (req: Request, res: Response) => {
  try {
    // Log analytics
    logAnalytics('view_suggestions', {
      userId: req.user?.userId,
      timestamp: new Date()
    });

    // TODO: Implement suggestion generation logic
    const suggestions = [
      {
        id: 1,
        type: 'budget',
        message: 'Consider setting up a budget for your recurring expenses',
        priority: 'high'
      },
      {
        id: 2,
        type: 'category',
        message: 'You have several uncategorized transactions',
        priority: 'medium'
      }
    ];

    res.json(suggestions);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({ message: 'Error getting suggestions' });
  }
}; 