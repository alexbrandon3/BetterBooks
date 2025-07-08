// transaction.controller.ts

import { Request, Response } from "express";
import { getUser } from "../utils/getUser";
import { TransactionService } from "../services/transaction.service";
import { CreateTransactionDTO, TransactionType, EntryType } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { AuthenticatedRequest } from "../types/express";
import { BaseController } from "./base.controller";
import { Transaction } from "../entities/Transaction";

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

      // For now, use the simple getTransactions method
      const transactions = await this.transactionService.getTransactions(user.id);
      
      console.log('📤 Sending transactions response:', JSON.stringify({
        transactions: transactions.map((t: Transaction) => ({
          id: t.id,
          description: t.description,
          entryCount: t.entries?.length,
          entries: t.entries?.map((e: any) => ({
            id: e.id,
            amount: e.amount,
            type: e.type,
            accountId: e.account?.id
          }))
        }))
      }, null, 2));

      res.json(transactions);
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