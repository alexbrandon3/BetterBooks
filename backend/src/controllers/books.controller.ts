import {  Response } from "express";
import { getUser } from "../utils/getUser";
import { ClosingEntryService, ClosingEntryRequest } from "../services/closingEntry.service";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { AuthenticatedRequest } from "../types/express";

export class BooksController {
  private closingEntryService = new ClosingEntryService();

  async closeBooks(req: AuthenticatedRequest, res: Response): Promise<void> {
    logInfo('Starting closeBooks', 'BooksController');

    try {
      const user = await getUser(req);
      if (!user) {
        logError('Unauthorized - No user found', 'BooksController');
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { periodEndDate, periodType } = req.body;

      // Validate required fields
      if (!periodEndDate || !periodType) {
        logError('Missing required fields', 'BooksController');
        res.status(400).json({ 
          error: "Missing required fields",
          details: "periodEndDate and periodType are required"
        });
        return;
      }

      // Validate period type
      if (!['monthly', 'quarterly', 'yearly'].includes(periodType)) {
        logError('Invalid period type', 'BooksController');
        res.status(400).json({ 
          error: "Invalid period type",
          details: "Only 'monthly', 'quarterly', and 'yearly' are supported"
        });
        return;
      }

      // Validate date format
      const endDate = new Date(periodEndDate);
      if (isNaN(endDate.getTime())) {
        logError('Invalid date format', 'BooksController');
        res.status(400).json({ 
          error: "Invalid date format",
          details: "periodEndDate must be a valid date in YYYY-MM-DD format"
        });
        return;
      }

      const closingRequest: ClosingEntryRequest = {
        periodEndDate,
        periodType
      };

      logInfo(`Creating closing entries for user ${user.id}, period: ${periodEndDate}`, 'BooksController');
      
      const result = await this.closingEntryService.createClosingEntries(user.id, closingRequest);
      
      if (result.success) {
        logSuccess(`Books closed successfully for user ${user.id}`, 'BooksController');
        res.status(200).json({
          success: true,
          message: result.message,
          transactionId: result.transactionId,
          netIncome: result.netIncome,
          entriesCreated: result.entriesCreated
        });
      } else {
        logError(`Failed to close books for user ${user.id}: ${result.message}`, 'BooksController');
        res.status(400).json({
          success: false,
          error: result.message
        });
      }

    } catch (error) {
      logError(`Error in closeBooks: ${error instanceof Error ? error.message : 'Unknown error'}`, 'BooksController');
      res.status(500).json({ 
        error: "Failed to close books",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async previewClosingEntries(req: AuthenticatedRequest, res: Response): Promise<void> {
    logInfo('Starting previewClosingEntries', 'BooksController');

    try {
      const user = await getUser(req);
      if (!user) {
        logError('Unauthorized - No user found', 'BooksController');
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { periodEndDate, periodType = 'monthly' } = req.body;

      // Validate required fields
      if (!periodEndDate) {
        logError('Missing periodEndDate', 'BooksController');
        res.status(400).json({ 
          error: "Missing required field",
          details: "periodEndDate is required"
        });
        return;
      }

      // Validate period type
      if (!['monthly', 'quarterly', 'yearly'].includes(periodType)) {
        logError('Invalid period type', 'BooksController');
        res.status(400).json({ 
          error: "Invalid period type",
          details: "Only 'monthly', 'quarterly', and 'yearly' are supported"
        });
        return;
      }

      // Validate date format
      const endDate = new Date(periodEndDate);
      if (isNaN(endDate.getTime())) {
        logError('Invalid date format', 'BooksController');
        res.status(400).json({ 
          error: "Invalid date format",
          details: "periodEndDate must be a valid date in YYYY-MM-DD format"
        });
        return;
      }

      logInfo(`Generating closing entry preview for user ${user.id}, period: ${periodEndDate}, type: ${periodType}`, 'BooksController');
      
      const preview = await this.closingEntryService.generateClosingEntryPreview(user.id, periodEndDate, periodType);
      
      logSuccess(`Closing entry preview generated for user ${user.id}`, 'BooksController');
      res.status(200).json({
        success: true,
        preview
      });

    } catch (error) {
      logError(`Error in previewClosingEntries: ${error instanceof Error ? error.message : 'Unknown error'}`, 'BooksController');
      res.status(500).json({ 
        error: "Failed to generate closing entry preview",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

// Create and export an instance of the controller
const booksController = new BooksController();

export const {
  closeBooks,
  previewClosingEntries
} = booksController; 