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
    console.log('🔍 Fetching transactions for user', userId);
    
    const totalEntries = await this.journalEntryRepo
      .createQueryBuilder('entry')
      .where('entry.userId = :userId', { userId })
      .getCount();
    console.log('📊 Found', totalEntries, 'total journal entries for user');

    const transactions = await this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.entries', 'entry')
      .leftJoinAndSelect('entry.account', 'account')
      .leftJoinAndSelect('transaction.user', 'user')
      .where('user.id = :userId', { userId })
      .orderBy('transaction.date', 'DESC')
      .take(5)
      .getMany();

    console.log('🔍 Retrieved transactions:', transactions.map(tx => ({
      id: tx.id,
      description: tx.description,
      entryCount: tx.entries?.length,
      entries: tx.entries?.map(e => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        accountId: e.account?.id,
        accountName: e.account?.name
      }))
    })));

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

            console.log('📝 Creating journal entry:', {
              amount: entry.amount,
              type: entry.type,
              accountId: entry.accountId,
              transactionId: savedTransaction.id
            });

            return transactionalEntityManager.create(JournalEntry, {
              amount: entry.amount,
              type: entry.type as EntryType,
              account,
              user,
              transaction: savedTransaction
            });
          });

          const savedEntries = await transactionalEntityManager.save(journalEntries);
          console.log('✅ Saved journal entries:', savedEntries.map(e => ({
            id: e.id,
            amount: e.amount,
            type: e.type,
            accountId: e.account?.id,
            transactionId: e.transaction?.id
          })));

          // Return the full transaction with entries
          const fullTransaction = await transactionalEntityManager.findOne(Transaction, {
            where: { id: savedTransaction.id },
            relations: ['entries', 'entries.account', 'user']
          });

          if (!fullTransaction) {
            logError('Failed to retrieve created transaction', 'TransactionService');
            throw new Error("Failed to retrieve created transaction");
          }

          console.log('📦 Final transaction with entries:', {
            id: fullTransaction.id,
            description: fullTransaction.description,
            entryCount: fullTransaction.entries?.length,
            entries: fullTransaction.entries?.map(e => ({
              id: e.id,
              amount: e.amount,
              type: e.type,
              accountId: e.account?.id
            }))
          });

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
    console.log("🚀 Transaction Service - Starting updateTransaction");
    console.log("📦 Update data:", {
      id,
      description: data.description,
      date: data.date,
      entryCount: data.entries?.length
    });

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['entries', 'entries.account']
      });

      if (!transaction) {
        console.error("❌ Transaction not found:", id);
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
      console.log("✅ Transaction updated successfully:", updatedTransaction.id);
      return updatedTransaction;
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      throw error;
    }
  }

  async deleteTransaction(id: string, userId: number): Promise<void> {
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id, user: { id: userId } }
      });

      if (!transaction) {
        throw new Error(`Transaction with ID ${id} not found`);
      }

      await this.transactionRepo.remove(transaction);
    } catch (error) {
      console.error("Error in deleteTransaction service:", error);
      throw error;
    }
  }

  async suggestAccount(_description: string, _userId: number): Promise<Account | null> {
    try {
      // Implementation for account suggestion
      return null;
    } catch (error) {
      console.error("Error in suggestAccount service:", error);
      throw error;
    }
  }

  async getRecurringTransactions(_userId: number): Promise<Transaction[]> {
    try {
      // Implementation for recurring transactions
      return [];
    } catch (error) {
      console.error("Error in getRecurringTransactions service:", error);
      throw error;
    }
  }
} 