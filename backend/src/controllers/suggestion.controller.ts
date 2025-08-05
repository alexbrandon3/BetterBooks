import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { BaseController } from './base.controller';
import { SuggestionService } from '../services/suggestion.service';
import { AccountWeightService } from '../services/AccountWeightService';

export class SuggestionController extends BaseController {
  private suggestionService: SuggestionService;
  private accountWeightService: AccountWeightService;

  constructor() {
    super();
    this.suggestionService = new SuggestionService();
    this.accountWeightService = new AccountWeightService();
  }

  async suggestAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description } = req.body;
      
      if (!description || typeof description !== 'string') {
        this.sendError(res, 400, 'Description is required and must be a string');
        return;
      }

      const userId = req.user.userId;
      const suggestion = await this.suggestionService.suggestAccountForDescription(description, userId);
      
      this.sendResponse(res, 200, suggestion);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async getUserWeights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const weights = await this.accountWeightService.getUserWeights(userId);
      
      this.sendResponse(res, 200, weights);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async createOrUpdateWeight(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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
      
      this.sendResponse(res, 200, weightData);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async deleteWeight(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        this.sendError(res, 400, 'Valid weight ID is required');
        return;
      }

      await this.accountWeightService.deleteWeight(Number(id), userId);
      
      this.sendResponse(res, 200, { message: 'Weight deleted successfully' });
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async initializeDefaultWeights(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user.userId;
      
      await this.accountWeightService.initializeDefaultWeights(userId);
      
      this.sendResponse(res, 200, { message: 'Default weights initialized successfully' });
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }
} 