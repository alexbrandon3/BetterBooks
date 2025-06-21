import { Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { RecurringTransaction } from '../entities/RecurringTransaction';
import { Account } from '../entities/Account';
import { AuthenticatedRequest } from '../types/express';
import { getUser } from '../utils/getUser';
import { logInfo, logSuccess, logError } from '../utils/logger';

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
  
  try {
    const user = await getUser(req);
    if (!user) {
      logError('Unauthorized - No user found', 'RecurringController');
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { description, amount, recurrencePattern, nextRun, endDate, accountId } = req.body;

    // Validate required fields
    if (!description || !amount || !recurrencePattern || !nextRun || !accountId) {
      logError('Missing required fields', 'RecurringController');
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate account ownership
    const accountRepo = AppDataSource.getRepository(Account);
    const account = await accountRepo.findOne({
      where: { id: accountId, user: { id: user.id } }
    });

    if (!account) {
      logError(`Account not found or not owned by user: ${accountId}`, 'RecurringController');
      return res.status(404).json({ error: "Account not found" });
    }

    // Create recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const recurringTransaction = recurringTransactionRepo.create({
      description,
      amount: Number(amount),
      recurrencePattern,
      nextRun: new Date(nextRun),
      endDate: endDate ? new Date(endDate) : undefined,
      user,
      account
    });

    const savedTransaction = await recurringTransactionRepo.save(recurringTransaction);
    logSuccess(`Recurring transaction created successfully (ID: ${savedTransaction.id})`, 'RecurringController');
    
    return res.status(201).json(savedTransaction);
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
    if (!id) {
      logError('Missing transaction ID', 'RecurringController');
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    // Find and delete the recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transaction = await recurringTransactionRepo.findOne({
      where: { id: Number(id), user: { id: user.id } }
    });

    if (!transaction) {
      logError(`Recurring transaction not found: ${id}`, 'RecurringController');
      return res.status(404).json({ error: "Recurring transaction not found" });
    }

    await recurringTransactionRepo.remove(transaction);
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
    if (!id) {
      logError('Missing transaction ID', 'RecurringController');
      return res.status(400).json({ error: "Transaction ID is required" });
    }

    const { description, amount, recurrencePattern, nextRun, endDate, accountId } = req.body;

    // Validate required fields
    if (!description || !amount || !recurrencePattern || !nextRun || !accountId) {
      logError('Missing required fields', 'RecurringController');
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the recurring transaction
    const recurringTransactionRepo = AppDataSource.getRepository(RecurringTransaction);
    const transaction = await recurringTransactionRepo.findOne({
      where: { id: Number(id), user: { id: user.id } },
      relations: ['account']
    });

    if (!transaction) {
      logError(`Recurring transaction not found: ${id}`, 'RecurringController');
      return res.status(404).json({ error: "Recurring transaction not found" });
    }

    // Validate account ownership if account is being changed
    if (accountId !== transaction.account.id) {
      const accountRepo = AppDataSource.getRepository(Account);
      const account = await accountRepo.findOne({
        where: { id: accountId, user: { id: user.id } }
      });

      if (!account) {
        logError(`Account not found or not owned by user: ${accountId}`, 'RecurringController');
        return res.status(404).json({ error: "Account not found" });
      }
      transaction.account = account;
    }

    // Update the transaction
    transaction.description = description;
    transaction.amount = Number(amount);
    transaction.recurrencePattern = recurrencePattern;
    transaction.nextRun = new Date(nextRun);
    transaction.endDate = endDate ? new Date(endDate) : undefined;

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