import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { BaseController } from './base.controller';
import { SuggestionService } from '../services/suggestion.service';

export class SuggestionController extends BaseController {
  private suggestionService: SuggestionService;

  constructor() {
    super();
    this.suggestionService = new SuggestionService();
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
} 