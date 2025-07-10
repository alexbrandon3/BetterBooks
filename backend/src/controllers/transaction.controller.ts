// transaction.controller.ts

import { Request, Response } from "express";
import { getUser } from "../utils/getUser";
import { TransactionService } from "../services/transaction.service";
import { ExportService } from "../services/export.service";
import { CreateTransactionDTO, TransactionType, EntryType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { AuthenticatedRequest } from "../types/express";
import { BaseController } from "./base.controller";
import { Transaction } from "../entities/Transaction";

export class TransactionController extends BaseController {
  private transactionService: TransactionService;
  private exportService: ExportService;

  constructor() {
    super();
    this.transactionService = new TransactionService();
    this.exportService = new ExportService();
  }

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Get pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Get filtering parameters
      const search = req.query.search as string;
      const type = req.query.type as string;
      const category = req.query.category as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
      const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;

      // Get sorting parameters
      const sortBy = req.query.sortBy as string || 'date';
      const sortOrder = req.query.sortOrder as string || 'desc';

      // Get all transactions with filtering
      const allTransactions = await this.transactionService.getTransactionsWithFilters(
        user.id,
        {
          search,
          type,
          category,
          startDate,
          endDate,
          accountId,
          minAmount,
          maxAmount
        }
      );

      // Apply sorting
      const sortedTransactions = allTransactions.sort((a: Transaction, b: Transaction) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'date':
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case 'amount':
            // Convert to numbers to ensure proper numeric sorting
            aValue = parseFloat(a.amount.toString());
            bValue = parseFloat(b.amount.toString());
            break;
          case 'description':
            aValue = a.description.toLowerCase();
            bValue = b.description.toLowerCase();
            break;
          case 'type':
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          default:
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Apply pagination
      const total = sortedTransactions.length;
      const totalPages = Math.ceil(total / limit);
      const transactions = sortedTransactions.slice(offset, offset + limit);

      res.json({
        transactions,
        total,
        page,
        totalPages,
        filters: {
          search,
          type,
          category,
          startDate,
          endDate,
          accountId,
          minAmount,
          maxAmount
        },
        sorting: {
          sortBy,
          sortOrder
        }
      });
    } catch (error) {
      console.error("❌ Error in getTransactions controller:", error);
      res.status(500).json({ 
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  getRecentTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      // For now, get all transactions and slice them
      const allTransactions = await this.transactionService.getTransactions(user.id);
      const recentTransactions = allTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
      
      res.json(recentTransactions);
    } catch (error) {
      console.error("❌ Error in getRecentTransactions controller:", error);
      res.status(500).json({ 
        error: "Failed to fetch recent transactions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  getAccountBalances = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // For now, return empty balances - we'll implement this properly later
      const balanceArray: Array<{accountId: number, balance: number}> = [];
      
      res.json(balanceArray);
    } catch (error) {
      console.error("❌ Error in getAccountBalances controller:", error);
      res.status(500).json({ 
        error: "Failed to fetch account balances",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  createTransaction = async (req: Request, res: Response): Promise<void> => {
    logInfo('Starting createTransaction', 'TransactionController');

    try {
      const user = await getUser(req);
      if (!user) {
        logError('Unauthorized - No user found', 'TransactionController');
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Extract and validate description
      const { description } = req.body;
      if (!description || typeof description !== 'string' || !description.trim()) {
        logError('Invalid description', 'TransactionController');
        res.status(400).json({ error: "Description must be a non-empty string" });
        return;
      }

      // Extract and validate date
      const { date } = req.body;
      if (!date || typeof date !== 'string') {
        logError('Invalid date', 'TransactionController');
        res.status(400).json({ error: "Date must be a valid ISO string" });
        return;
      }
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        logError('Invalid date format', 'TransactionController');
        res.status(400).json({ error: "Date must be a valid date" });
        return;
      }

      // Extract and validate type
      const { type } = req.body;
      if (!type || !Object.values(TransactionType).includes(type)) {
        logError('Invalid type', 'TransactionController');
        res.status(400).json({ error: `Type must be one of: ${Object.values(TransactionType).join(', ')}` });
        return;
      }

      // Extract and validate category
      const { category } = req.body;
      if (!category || typeof category !== 'string' || !category.trim()) {
        logError('Invalid category', 'TransactionController');
        res.status(400).json({ error: "Category must be a non-empty string" });
        return;
      }

      // Extract and validate amount
      const { amount } = req.body;
      if (typeof amount !== 'number' || isNaN(amount)) {
        logError('Invalid amount', 'TransactionController');
        res.status(400).json({ error: "Amount must be a valid number" });
        return;
      }

      // Extract and validate entries
      const { entries } = req.body;
      if (!Array.isArray(entries) || entries.length < 2) {
        logError('Invalid entries', 'TransactionController');
        res.status(400).json({ error: "At least two journal entries are required" });
        return;
      }

      // Validate each entry
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        
        if (typeof entry.amount !== 'number' || isNaN(entry.amount) || entry.amount <= 0) {
          logError(`Invalid amount in entry ${i + 1}`, 'TransactionController');
          res.status(400).json({ 
            error: `Entry ${i + 1}: Amount must be a positive number`,
            details: { entryIndex: i, field: 'amount', value: entry.amount }
          });
          return;
        }

        if (!entry.type || !Object.values(EntryType).includes(entry.type)) {
          logError(`Invalid type in entry ${i + 1}`, 'TransactionController');
          res.status(400).json({ 
            error: `Entry ${i + 1}: Type must be one of: ${Object.values(EntryType).join(', ')}`,
            details: { entryIndex: i, field: 'type', value: entry.type }
          });
          return;
        }

        if (typeof entry.accountId !== 'number' || isNaN(entry.accountId)) {
          logError(`Invalid accountId in entry ${i + 1}`, 'TransactionController');
          res.status(400).json({ 
            error: `Entry ${i + 1}: Account ID must be a number`,
            details: { entryIndex: i, field: 'accountId', value: entry.accountId }
          });
          return;
        }
      }

      // Create sanitized transaction data
      const transactionData: CreateTransactionDTO = {
        description: description.trim(),
        date: parsedDate,
        type: type as TransactionType,
        category: category.trim(),
        amount: Number(amount),
        entries: entries.map(entry => ({
          amount: Number(entry.amount),
          type: entry.type as EntryType,
          accountId: Number(entry.accountId)
        })),
        userId: user.id
      };

      logInfo('Input validated, creating transaction', 'TransactionController');
      const result = await this.transactionService.createTransaction(transactionData);
      logSuccess(`Transaction created successfully (ID: ${result.transaction.id})`, 'TransactionController');
      
      // Return transaction with warnings if any
      const response: any = result.transaction;
      if (result.warnings && result.warnings.length > 0) {
        response.warnings = result.warnings;
        logInfo(`Transaction created with ${result.warnings.length} warnings`, 'TransactionController');
      }
      
      res.status(201).json(response);
    } catch (error) {
      logError(`Error creating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionController');
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ 
          error: "Resource not found",
          details: error.message
        });
      } else {
        res.status(500).json({ 
          error: "Failed to create transaction",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };

  updateTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const transaction = await this.transactionService.updateTransaction(id, req.body);
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ 
        error: "Failed to update transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  updateTransactionPartial = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      // Only allow specific fields to be updated
      const allowedUpdates: any = {};
      if (updates.type) allowedUpdates.type = updates.type;
      if (updates.description) allowedUpdates.description = updates.description;
      if (updates.date) allowedUpdates.date = updates.date;
      if (updates.category) allowedUpdates.category = updates.category;

      const updatedTransaction = await this.transactionService.updateTransactionPartial(id, allowedUpdates, user.id);
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("❌ Error in updateTransactionPartial controller:", error);
      res.status(500).json({ 
        error: "Failed to update transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      await this.transactionService.deleteTransaction(id, user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ 
        error: "Failed to delete transaction",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  async suggestAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description } = req.body;
      if (!description || typeof description !== 'string') {
        res.status(400).json({ error: "Description is required" });
        return;
      }

      const suggestion = await this.transactionService.suggestAccount(description, req.user.userId);
      res.json(suggestion);
    } catch (error) {
      console.error("Error suggesting account:", error);
      res.status(500).json({ error: "Failed to suggest account" });
    }
  }

  async getRecurringTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const recurringTransactions = await this.transactionService.getRecurringTransactions(req.user.userId);
      res.json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ error: "Failed to fetch recurring transactions" });
    }
  }

  async getTransactionTemplates(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const templates = await this.transactionService.getTransactionTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching transaction templates:", error);
      res.status(500).json({ error: "Failed to fetch transaction templates" });
    }
  }

  async suggestTransactionTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description, entries } = req.body;
      if (!description || !entries) {
        res.status(400).json({ error: "Description and entries are required" });
        return;
      }

      const template = await this.transactionService.suggestTransactionTemplate(description, entries);
      res.json({ template });
    } catch (error) {
      console.error("Error suggesting transaction template:", error);
      res.status(500).json({ error: "Failed to suggest transaction template" });
    }
  }

  async validateTransactionTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { transactionType, entries } = req.body;
      if (!transactionType || !entries) {
        res.status(400).json({ error: "Transaction type and entries are required" });
        return;
      }

      const validation = await this.transactionService.validateTransactionTemplate(transactionType, entries);
      res.json(validation);
    } catch (error) {
      console.error("Error validating transaction template:", error);
      res.status(500).json({ error: "Failed to validate transaction template" });
    }
  }

  async getUniqueCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const categories = await this.transactionService.getUniqueCategories(user.id);
      res.json(categories);
    } catch (error) {
      console.error("❌ Error in getUniqueCategories controller:", error);
      res.status(500).json({ 
        error: "Failed to fetch unique categories",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async exportTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const {
        format = 'csv',
        dateRange,
        filters,
        includeHeaders = true,
        includeAccountDetails = true,
        includeCategoryBreakdown = false,
        groupBy
      } = req.body;

      if (!format || !['csv', 'pdf'].includes(format)) {
        res.status(400).json({ error: "Invalid format. Must be 'csv' or 'pdf'" });
        return;
      }

      const exportOptions = {
        format,
        dateRange,
        filters,
        includeHeaders,
        includeAccountDetails,
        includeCategoryBreakdown,
        groupBy
      };

      const result = await this.exportService.exportTransactions(user.id, exportOptions);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      
      // Handle different content types
      if (result.contentType === 'application/pdf') {
        // For PDF, send as buffer
        const buffer = Buffer.from(result.data, 'base64');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
      } else {
        // For CSV, send as string
        res.setHeader('Content-Length', Buffer.byteLength(result.data, 'utf8'));
        res.send(result.data);
      }
    } catch (error) {
      console.error("❌ Error in exportTransactions controller:", error);
      res.status(500).json({ 
        error: "Failed to export transactions",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async generateFinancialSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { dateRange } = req.body;
      const summary = await this.exportService.generateFinancialSummary(user.id, dateRange);
      
      res.json(summary);
    } catch (error) {
      console.error("❌ Error in generateFinancialSummary controller:", error);
      res.status(500).json({ 
        error: "Failed to generate financial summary",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
}

// Create and export an instance of the controller
const transactionController = new TransactionController();

export const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  suggestAccount,
  getRecurringTransactions,
  getTransactionTemplates,
  suggestTransactionTemplate,
  validateTransactionTemplate,
  getRecentTransactions,
  getAccountBalances,
} = transactionController;