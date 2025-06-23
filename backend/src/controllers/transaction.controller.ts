// transaction.controller.ts

import { Request, Response } from "express";
import { getUser } from "../utils/getUser";
import { TransactionService } from "../services/transaction.service";
import { CreateTransactionDTO, UpdateTransactionDTO, TransactionType, EntryType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { AuthenticatedRequest } from "../types/express";
import { BaseController } from "./base.controller";

export class TransactionController extends BaseController {
  private transactionService: TransactionService;

  constructor() {
    super();
    this.transactionService = new TransactionService();
  }

  getTransactions = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Use validatedQuery if available (for recurring transactions), otherwise use user.id
      const userId = (req as any).validatedQuery?.userId || user.id;
      const transactions = await this.transactionService.getTransactions(userId);
      
      console.log('📤 Sending transactions response:', JSON.stringify(transactions.map(t => ({
        id: t.id,
        description: t.description,
        entryCount: t.entries?.length,
        entries: t.entries?.map(e => ({
          id: e.id,
          amount: e.amount,
          type: e.type,
          accountId: e.account?.id
        }))
      })), null, 2));

      res.json(transactions);
    } catch (error) {
      console.error("❌ Error in getTransactions controller:", error);
      res.status(500).json({ 
        error: "Failed to fetch transactions",
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

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: "Invalid transaction ID" });
        return;
      }

      const transactionData: UpdateTransactionDTO = {
        ...req.body,
        userId: user.id,
      };

      const transaction = await this.transactionService.updateTransaction(id, transactionData);
      if (!transaction) {
        res.status(404).json({ error: "Transaction not found" });
        return;
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error in updateTransaction controller:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ 
          error: "Resource not found",
          details: error.message
        });
      } else {
        res.status(500).json({ 
          error: "Failed to update transaction",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };

  deleteTransaction = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: "Invalid transaction ID" });
        return;
      }

      await this.transactionService.deleteTransaction(id, user.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error in deleteTransaction controller:", error);
      if (error instanceof Error && error.message.includes("not found")) {
        res.status(404).json({ 
          error: "Resource not found",
          details: error.message
        });
      } else {
        res.status(500).json({ 
          error: "Failed to delete transaction",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };

  async suggestAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { description } = req.query;
      if (!description || typeof description !== 'string') {
        this.sendError(res, 400, "Description is required");
        return;
      }

      const account = await this.transactionService.suggestAccount(description, req.user.userId);
      this.sendResponse(res, 200, account);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
    }
  }

  async getRecurringTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const transactions = await this.transactionService.getRecurringTransactions(req.user.userId);
      this.sendResponse(res, 200, transactions);
    } catch (error) {
      this.sendError(res, 500, error instanceof Error ? error.message : "Unknown error");
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
} = transactionController;