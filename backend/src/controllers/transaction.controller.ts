// transaction.controller.ts

import { Request, Response } from "express";
import { getUser } from "../utils/getUser";
import { TransactionService } from "../services/transaction.service";
import { CreateTransactionDTO, UpdateTransactionDTO } from "../types/transaction.types";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";

export class TransactionController {
  public transactionService: TransactionService;

  constructor() {
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

      // Extract and validate startDate
      const { startDate } = req.body;
      if (!startDate || typeof startDate !== 'string') {
        logError('Invalid startDate', 'TransactionController');
        res.status(400).json({ error: "Start date must be a valid ISO string" });
        return;
      }
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        logError('Invalid date format', 'TransactionController');
        res.status(400).json({ error: "Start date must be a valid date" });
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

        if (!entry.type || !['DEBIT', 'CREDIT'].includes(entry.type)) {
          logError(`Invalid type in entry ${i + 1}`, 'TransactionController');
          res.status(400).json({ 
            error: `Entry ${i + 1}: Type must be either 'DEBIT' or 'CREDIT'`,
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
        startDate: parsedDate,
        entries: entries.map(entry => ({
          amount: Number(entry.amount),
          type: entry.type,
          accountId: Number(entry.accountId)
        })),
        userId: user.id
      };

      logInfo('Input validated, creating transaction', 'TransactionController');
      const transaction = await this.transactionService.createTransaction(transactionData);
      logSuccess(`Transaction created successfully (ID: ${transaction.id})`, 'TransactionController');
      res.status(201).json(transaction);
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

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
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

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
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

  suggestAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await getUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { description } = req.query;
      if (!description || typeof description !== "string") {
        res.status(400).json({ error: "Description query parameter is required" });
        return;
      }

      const suggestion = await this.transactionService.suggestAccount(description, user.id);
      res.json(suggestion);
    } catch (error) {
      console.error("Error in suggestAccount controller:", error);
      res.status(500).json({ 
        error: "Failed to suggest account",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  getRecurringTransactions = async (req: Request, res: Response) => {
    console.group('🔄 Recurring Transactions Request');
    console.log('Request details:', {
      userId: req.user?.id,
      query: req.query
    });

    try {
      if (!req.user?.id) {
        console.error('❌ Unauthorized: No user ID provided');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.user.id.toString());
      if (isNaN(userId)) {
        console.error('❌ Invalid user ID:', req.user.id);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
      const recurringTransactions = await recurringRepo.find({
        where: { user: { id: userId } },
        relations: ["account", "user"],
      });

      console.log('✅ Recurring transactions fetched:', recurringTransactions.length);
      console.groupEnd();
      return res.json(recurringTransactions);
    } catch (error) {
      console.group('❌ Recurring Transactions Error');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.response?.data) {
        console.error('Response Data:', error.response.data);
      }
      console.error('Error Name:', error.name);
      console.error('User ID:', req.user?.id);
      console.groupEnd();
      return res.status(500).json({ message: 'Failed to load recurring transactions', error: error.message });
    }
  };

  getRecurringTransactionById = async (req: Request, res: Response) => {
    console.group('🔄 Recurring Transaction by ID Request');
    console.log('Request details:', {
      userId: req.user?.id,
      id: req.params.id
    });

    try {
      if (!req.user?.id) {
        console.error('❌ Unauthorized: No user ID provided');
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.user.id.toString());
      if (isNaN(userId)) {
        console.error('❌ Invalid user ID:', req.user.id);
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.error('❌ Invalid recurring transaction ID:', req.params.id);
        return res.status(400).json({ message: "Invalid recurring transaction ID" });
      }

      const recurringRepo = AppDataSource.getRepository(RecurringTransaction);
      const recurringTransaction = await recurringRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ["account", "user"],
      });

      if (!recurringTransaction) {
        console.error('❌ Recurring transaction not found:', id);
        return res.status(404).json({ message: "Recurring transaction not found" });
      }

      console.log('✅ Recurring transaction fetched:', recurringTransaction);
      console.groupEnd();
      return res.json(recurringTransaction);
    } catch (error) {
      console.group('❌ Recurring Transaction by ID Error');
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      if (error.response?.data) {
        console.error('Response Data:', error.response.data);
      }
      console.error('Error Name:', error.name);
      console.error('User ID:', req.user?.id);
      console.error('Recurring Transaction ID:', req.params.id);
      console.groupEnd();
      return res.status(500).json({ message: 'Failed to load recurring transaction', error: error.message });
    }
  };
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
  getRecurringTransactionById,
} = transactionController;