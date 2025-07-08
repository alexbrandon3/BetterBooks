import { Request, Response } from 'express';
import { generateSuggestions } from '../services/suggestionEngine/generateSuggestions';
import { AccountService } from '../services/AccountService';
import { TransactionService } from '../services/TransactionService';
import { logAnalytics } from '../utils/analytics';
import { User } from '../entities/User';
import { AuthenticatedRequest } from '../types/express';
import { BaseController } from './base.controller';
import { SuggestionService } from '../services/suggestion.service';
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

  constructor() {
    super();
    this.suggestionService = new SuggestionService();
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