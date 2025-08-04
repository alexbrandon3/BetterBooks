import {  Response } from "express";
import { AppDataSource } from "../config/data-source";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { Account } from "../entities/Account";
import { TransactionService } from "../services/transaction.service";
import { CreateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { AuthenticatedRequest } from "../types/express";
import { getUser } from "../utils/getUser";
import { logInfo, logSuccess, logError } from "../utils/logger";

export const getRecurringTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only fetch recurring transactions for the authenticated user, including required relations
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transactions = await recurringTransactionRepo.find({
      where: { user: { id: req.user.userId } },
      relations: ['account'],
      order: { nextRun: 'ASC' }
    });
    return res.json(transactions);
  } catch (error) {
    console.error('❌ Error in getRecurringTransactions:');
    console.error('Error object:', error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('User ID:', req.user?.userId);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const createRecurringTransaction = async (req: AuthenticatedRequest, res: Response) => {
  logInfo('Starting createRecurringTransaction', 'RecurringController');
  logInfo(`Request body: ${JSON.stringify(req.body)}`, 'RecurringController');
  
  try {
    const user = await getUser(req);
    if (!user) {
      logError('Unauthorized - No user found', 'RecurringController');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { description, amount, recurrencePattern, nextRun, endDate, primaryAccountId, secondaryAccountId, primaryEntryType, secondaryEntryType, type } = req.body;

    // Validate required fields
    if (!description || !amount || !recurrencePattern || !nextRun || !primaryAccountId || !secondaryAccountId || !primaryEntryType || !secondaryEntryType) {
      logError(`Missing required fields: description=${!!description}, amount=${!!amount}, recurrencePattern=${!!recurrencePattern}, nextRun=${!!nextRun}, primaryAccountId=${!!primaryAccountId}, secondaryAccountId=${!!secondaryAccountId}, primaryEntryType=${!!primaryEntryType}, secondaryEntryType=${!!secondaryEntryType}`, 'RecurringController');
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate account ownership
    const accountRepo = AppDataSource.getRepository(Account);
    logInfo(`Looking for primary account ${primaryAccountId} for user ${user.id}`, 'RecurringController');
    const primaryAccount = await accountRepo.findOne({
      where: { id: primaryAccountId, user: { id: user.id } }
    });

    if (!primaryAccount) {
      logError(`Primary account not found or not owned by user: ${primaryAccountId}`, 'RecurringController');
      return res.status(404).json({ error: "Primary account not found" });
    }
    
    logInfo(`Looking for secondary account ${secondaryAccountId} for user ${user.id}`, 'RecurringController');
    const secondaryAccount = await accountRepo.findOne({
      where: { id: secondaryAccountId, user: { id: user.id } }
    });

    if (!secondaryAccount) {
      logError(`Secondary account not found or not owned by user: ${secondaryAccountId}`, 'RecurringController');
      return res.status(404).json({ error: "Secondary account not found" });
    }
    
    logInfo(`Found primary account: ${primaryAccount.name} (ID: ${primaryAccount.id}, Type: ${primaryAccount.type})`, 'RecurringController');
    logInfo(`Found secondary account: ${secondaryAccount.name} (ID: ${secondaryAccount.id}, Type: ${secondaryAccount.type})`, 'RecurringController');

    // Create recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const recurringTransaction = recurringTransactionRepo.create({
      description,
      amount: Number(amount),
      recurrencePattern,
      nextRun: new Date(nextRun),
      endDate: endDate ? new Date(endDate) : undefined,
      user,
      primaryAccount,
      secondaryAccount,
      primaryEntryType,
      secondaryEntryType
    });

    const savedRecurringTransaction = await recurringTransactionRepo.save(recurringTransaction);
    logSuccess(`Recurring transaction created successfully (ID: ${savedRecurringTransaction.id})`, 'RecurringController');
    
    // Create initial transaction immediately
    const transactionService = new TransactionService();
    const now = new Date();
    
    // Create transaction data for the initial transaction using the stored accounts
    const transactionData: CreateTransactionDTO = {
      description: description,
      date: now,
      type: type || TransactionType.EXPENSE, // Use the type from request or default to EXPENSE
      category: 'Recurring Transaction',
      amount: Math.abs(Number(amount)), // Use absolute value for amount
      entries: [
        {
          amount: Math.abs(Number(amount)),
          type: primaryEntryType as EntryType,
          accountId: primaryAccountId
        },
        {
          amount: Math.abs(Number(amount)),
          type: secondaryEntryType as EntryType,
          accountId: secondaryAccountId
        }
      ],
      userId: user.id
    };

    logInfo(`Creating initial transaction for recurring transaction ${savedRecurringTransaction.id}`, 'RecurringController');
    const initialTransaction = await transactionService.createTransaction(transactionData);
    logSuccess(`Initial transaction created successfully (ID: ${initialTransaction.transaction.id})`, 'RecurringController');
    
    return res.status(201).json({
      ...savedRecurringTransaction,
      initialTransaction: initialTransaction.transaction
    });
  } catch (error) {
    logError(`Error creating recurring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringController');
    return res.status(500).json({ 
      error: "Failed to create recurring transaction",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const deleteRecurringTransaction = async (req: AuthenticatedRequest, res: Response) => {
  logInfo('Starting deleteRecurringTransaction', 'RecurringController');
  
  try {
    const user = await getUser(req);
    if (!user) {
      logError('Unauthorized - No user found', 'RecurringController');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    
    const recurringTransaction = await recurringTransactionRepo.findOne({
      where: { id: parseInt(id), user: { id: user.id } }
    });

    if (!recurringTransaction) {
      logError(`Recurring transaction not found: ${id}`, 'RecurringController');
      return res.status(404).json({ error: "Recurring transaction not found" });
    }

    await recurringTransactionRepo.remove(recurringTransaction);
    logSuccess(`Recurring transaction deleted successfully (ID: ${id})`, 'RecurringController');
    
    return res.status(200).json({ message: "Recurring transaction deleted successfully" });
  } catch (error) {
    logError(`Error deleting recurring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringController');
    return res.status(500).json({ 
      error: "Failed to delete recurring transaction",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const updateRecurringTransaction = async (req: AuthenticatedRequest, res: Response) => {
  logInfo('Starting updateRecurringTransaction', 'RecurringController');
  
  try {
    const user = await getUser(req);
    if (!user) {
      logError('Unauthorized - No user found', 'RecurringController');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { description, amount, recurrencePattern, nextRun, endDate, primaryAccountId, secondaryAccountId, primaryEntryType, secondaryEntryType } = req.body;

    // Validate required fields
    if (!description || !amount || !recurrencePattern || !nextRun || !primaryAccountId || !secondaryAccountId || !primaryEntryType || !secondaryEntryType) {
      logError('Missing required fields', 'RecurringController');
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transaction = await recurringTransactionRepo.findOne({
      where: { id: Number(id), user: { id: user.id } },
      relations: ['primaryAccount', 'secondaryAccount']
    });

    if (!transaction) {
      logError(`Recurring transaction not found: ${id}`, 'RecurringController');
      return res.status(404).json({ error: "Recurring transaction not found" });
    }

    // Validate account ownership if accounts are being changed
    if (primaryAccountId !== transaction.primaryAccount.id || secondaryAccountId !== transaction.secondaryAccount.id) {
      const accountRepo = AppDataSource.getRepository(Account);
      const primaryAccount = await accountRepo.findOne({
        where: { id: primaryAccountId, user: { id: user.id } }
      });

      if (!primaryAccount) {
        logError(`Primary account not found or not owned by user: ${primaryAccountId}`, 'RecurringController');
        return res.status(404).json({ error: "Primary account not found" });
      }

      const secondaryAccount = await accountRepo.findOne({
        where: { id: secondaryAccountId, user: { id: user.id } }
      });

      if (!secondaryAccount) {
        logError(`Secondary account not found or not owned by user: ${secondaryAccountId}`, 'RecurringController');
        return res.status(404).json({ error: "Secondary account not found" });
      }

      transaction.primaryAccount = primaryAccount;
      transaction.secondaryAccount = secondaryAccount;
    }

    // Update the transaction
    transaction.description = description;
    transaction.amount = Number(amount);
    transaction.recurrencePattern = recurrencePattern;
    transaction.nextRun = new Date(nextRun);
    transaction.endDate = endDate ? new Date(endDate) : undefined;
    transaction.primaryEntryType = primaryEntryType;
    transaction.secondaryEntryType = secondaryEntryType;

    const updatedTransaction = await recurringTransactionRepo.save(transaction);
    logSuccess(`Recurring transaction updated successfully (ID: ${updatedTransaction.id})`, 'RecurringController');
    
    return res.status(200).json(updatedTransaction);
  } catch (error) {
    logError(`Error updating recurring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringController');
    return res.status(500).json({ 
      error: "Failed to update recurring transaction",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const toggleRecurringTransaction = async (req: AuthenticatedRequest, res: Response) => {
  logInfo('Starting toggleRecurringTransaction', 'RecurringController');
  
  try {
    const user = await getUser(req);
    if (!user) {
      logError('Unauthorized - No user found', 'RecurringController');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    if (!id) {
      logError('Missing transaction ID', 'RecurringController');
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    // Find the recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transaction = await recurringTransactionRepo.findOne({
      where: { id: Number(id), user: { id: user.id } }
    });

    if (!transaction) {
      logError(`Recurring transaction not found: ${id}`, 'RecurringController');
      return res.status(404).json({ error: "Recurring transaction not found" });
    }

    // Toggle the active status
    transaction.isActive = !transaction.isActive;
    const updatedTransaction = await recurringTransactionRepo.save(transaction);
    
    logSuccess(`Recurring transaction ${transaction.isActive ? 'activated' : 'deactivated'} successfully (ID: ${id})`, 'RecurringController');
    
    return res.status(200).json({
      message: `Recurring transaction ${transaction.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: updatedTransaction.isActive
    });
  } catch (error) {
    logError(`Error toggling recurring transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'RecurringController');
    return res.status(500).json({ 
      error: "Failed to toggle recurring transaction",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}; 