import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { Account } from "../entities/Account";
import { CreateTransactionDTO, UpdateTransactionDTO, EntryType } from "../types/transaction.types";
import { In } from "typeorm";
import { logInfo, logSuccess, logError } from '../utils/logger';

export class TransactionService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private journalEntryRepo = AppDataSource.getRepository(JournalEntry);
  private accountRepo = AppDataSource.getRepository(Account);
  private userRepo = AppDataSource.getRepository("User");

  async getTransactions(userId: number): Promise<Transaction[]> {
    logInfo(`Fetching transactions for user ${userId}`, 'TransactionService');
    
    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.entries', 'entry')
      .leftJoinAndSelect('entry.account', 'account')
      .leftJoinAndSelect('transaction.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('transaction.date', 'DESC')
      .take(5)
      .getMany();

    logSuccess(`Retrieved ${transactions.length} transactions for user ${userId}`, 'TransactionService');
    return transactions;
  }

  async createTransaction(transactionData: CreateTransactionDTO): Promise<Transaction> {
    logInfo('Starting createTransaction', 'TransactionService');

    try {
      // Validate user exists
      const user = await this.userRepo.findOne({ where: { id: transactionData.userId } });
      if (!user) {
        logError(`User not found: ${transactionData.userId}`, 'TransactionService');
        throw new Error(`User with ID ${transactionData.userId} not found`);
      }

      // Validate entry balance
      const debitTotal = transactionData.entries
        .filter(entry => entry.type === EntryType.DEBIT)
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const creditTotal = transactionData.entries
        .filter(entry => entry.type === EntryType.CREDIT)
        .reduce((sum, entry) => sum + entry.amount, 0);

      if (Math.abs(debitTotal - creditTotal) > 0.01) {
        logError(`Debit/credit mismatch: ${debitTotal} != ${creditTotal}`, 'TransactionService');
        throw new Error("Debits must equal credits");
      }
      logSuccess('Entry balance validated', 'TransactionService');

      // Validate account ownership
      const accountIds = transactionData.entries.map(entry => entry.accountId);
      const accounts = await this.accountRepo.find({
        where: { 
          id: In(accountIds), 
          user: { id: transactionData.userId }
        }
      });

      if (accounts.length !== accountIds.length) {
        logError(`Account validation failed: found ${accounts.length}/${accountIds.length} accounts`, 'TransactionService');
        throw new Error("One or more accounts not found or not owned by user");
      }
      logSuccess('Account ownership validated', 'TransactionService');

      // Create a map for quick account lookup
      const accountMap = new Map(accounts.map(account => [account.id, account]));

      return await AppDataSource.transaction(async transactionalEntityManager => {
        try {
          // Create and save the transaction
          const transaction = transactionalEntityManager.create(Transaction, {
            description: transactionData.description,
            date: transactionData.date,
            type: transactionData.type,
            category: transactionData.category,
            amount: transactionData.amount,
            user
          });

          const savedTransaction = await transactionalEntityManager.save(transaction);
          logSuccess(`Transaction saved (ID: ${savedTransaction.id})`, 'TransactionService');

          // Create and save journal entries
          const journalEntries = transactionData.entries.map(entry => {
            const account = accountMap.get(entry.accountId);
            if (!account) {
              throw new Error(`Account ${entry.accountId} not found in validated accounts`);
            }

            return transactionalEntityManager.create(JournalEntry, {
              amount: entry.amount,
              type: entry.type as EntryType,
              account,
              user,
              transaction: savedTransaction
            });
          });

          const savedEntries = await transactionalEntityManager.save(journalEntries);
          logSuccess(`Saved ${savedEntries.length} journal entries`, 'TransactionService');

          // Return the full transaction with entries
          const fullTransaction = await transactionalEntityManager.findOne(Transaction, {
            where: { id: savedTransaction.id },
            relations: ['entries', 'entries.account', 'user']
          });

          if (!fullTransaction) {
            logError('Failed to retrieve created transaction', 'TransactionService');
            throw new Error("Failed to retrieve created transaction");
          }

          logSuccess(`Transaction creation complete (ID: ${fullTransaction.id})`, 'TransactionService');
          return fullTransaction;
        } catch (error) {
          logError(`Database transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
          throw error;
        }
      });
    } catch (error) {
      logError(`Transaction creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async updateTransaction(id: string, data: UpdateTransactionDTO): Promise<Transaction> {
    logInfo(`Starting updateTransaction for ID: ${id}`, 'TransactionService');

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['entries', 'entries.account']
      });

      if (!transaction) {
        logError(`Transaction not found: ${id}`, 'TransactionService');
        throw new Error(`Transaction with ID ${id} not found`);
      }

      // Update transaction fields
      transaction.description = data.description;
      transaction.date = data.date;
      transaction.type = data.type;
      transaction.category = data.category;
      transaction.amount = data.amount;

      // Save the updated transaction
      const updatedTransaction = await this.transactionRepo.save(transaction);
      logSuccess(`Transaction updated successfully: ${updatedTransaction.id}`, 'TransactionService');
      return updatedTransaction;
    } catch (error) {
      logError(`Error updating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async deleteTransaction(id: string, userId: number): Promise<void> {
    logInfo(`Starting deleteTransaction for ID: ${id}`, 'TransactionService');
    
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ['entries']
      });

      if (!transaction) {
        logError(`Transaction not found: ${id}`, 'TransactionService');
        throw new Error(`Transaction with ID ${id} not found`);
      }

      // First delete all associated journal entries
      if (transaction.entries && transaction.entries.length > 0) {
        await this.journalEntryRepo.remove(transaction.entries);
        logSuccess(`Deleted ${transaction.entries.length} journal entries`, 'TransactionService');
      }

      // Then delete the transaction
      await this.transactionRepo.remove(transaction);
      logSuccess(`Transaction deleted successfully: ${id}`, 'TransactionService');
    } catch (error) {
      logError(`Error in deleteTransaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async suggestAccount(_description: string, _userId: number): Promise<Account | null> {
    try {
      // Implementation for account suggestion
      return null;
    } catch (error) {
      logError(`Error in suggestAccount: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async getRecurringTransactions(_userId: number): Promise<Transaction[]> {
    try {
      // Implementation for recurring transactions
      return [];
    } catch (error) {
      logError(`Error in getRecurringTransactions: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }
} 