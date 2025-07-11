import { AppDataSource } from "../config/data-source";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { Account, AccountType } from "../entities/Account";
import { CreateTransactionDTO, UpdateTransactionDTO, EntryType, TransactionType } from "../types/transaction.types";
import { In } from "typeorm";
import { logInfo, logSuccess, logError } from '../utils/logger';
import { TransactionTemplateService } from './transactionTemplate.service';

interface BalanceWarning {
  accountId: number;
  accountName: string;
  currentBalance: number;
  newBalance: number;
  message: string;
}

interface TransactionResult {
  transaction: Transaction;
  warnings?: BalanceWarning[];
  suggestedTemplate?: any;
  suggestedAccounts?: Account[];
}

export class TransactionService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
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
      .getMany();

    logSuccess(`Retrieved ${transactions.length} transactions for user ${userId}`, 'TransactionService');
    return transactions;
  }

  async getTransactionsWithFilters(
    userId: number, 
    filters: {
      search?: string;
      type?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
      accountId?: number;
      minAmount?: number;
      maxAmount?: number;
    }
  ): Promise<Transaction[]> {
    logInfo(`Fetching transactions with filters for user ${userId}`, 'TransactionService');
    
    let query = this.transactionRepo
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.entries', 'entry')
      .leftJoinAndSelect('entry.account', 'account')
      .leftJoinAndSelect('transaction.user', 'user')
      .where('user.id = :userId', { userId });

    // Apply search filter
    if (filters.search) {
      query = query.andWhere(
        '(transaction.description ILIKE :search OR transaction.category ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply type filter
    if (filters.type) {
      query = query.andWhere('transaction.type = :type', { type: filters.type });
    }

    // Apply category filter with fuzzy matching
    if (filters.category) {
      query = query.andWhere('transaction.category ILIKE :category', { category: `%${filters.category}%` });
    }

    // Apply date range filter
    if (filters.startDate) {
      query = query.andWhere('transaction.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query = query.andWhere('transaction.date <= :endDate', { endDate: filters.endDate });
    }

    // Apply account filter
    if (filters.accountId) {
      query = query.andWhere('entry.account.id = :accountId', { accountId: filters.accountId });
    }

    // Apply amount range filter
    if (filters.minAmount !== undefined) {
      query = query.andWhere('transaction.amount >= :minAmount', { minAmount: filters.minAmount });
    }
    if (filters.maxAmount !== undefined) {
      query = query.andWhere('transaction.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    const transactions = await query.orderBy('transaction.date', 'DESC').getMany();
    
    logSuccess(`Retrieved ${transactions.length} filtered transactions for user ${userId}`, 'TransactionService');
    return transactions;
  }

  async createTransaction(transactionData: CreateTransactionDTO): Promise<TransactionResult> {
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

      // Check for potential negative balances
      const warnings: BalanceWarning[] = [];
      for (const entry of transactionData.entries) {
        const account = accountMap.get(entry.accountId);
        if (!account) continue;

        // Calculate balance change based on entry type and account type
        let balanceChange = 0;
        
        // Ensure entry.amount is a number
        const entryAmount = Number(entry.amount);
        
        if (entry.type === EntryType.DEBIT) {
          // For ASSET and EXPENSE accounts, debit increases balance
          // For LIABILITY, INCOME, and EQUITY accounts, debit decreases balance
          if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
            balanceChange = entryAmount;
          } else {
            balanceChange = -entryAmount;
          }
        } else if (entry.type === EntryType.CREDIT) {
          // For ASSET and EXPENSE accounts, credit decreases balance
          // For LIABILITY, INCOME, and EQUITY accounts, credit increases balance
          if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
            balanceChange = -entryAmount;
          } else {
            balanceChange = entryAmount;
          }
        }

        // Update account balance
        const currentBalance = Number(account.balance || 0);
        const newBalance = currentBalance + balanceChange;
        
        // Check for negative balance on ASSET accounts (cash, checking, etc.)
        if (account.type === AccountType.ASSET && newBalance < 0) {
          warnings.push({
            accountId: account.id,
            accountName: account.name,
            currentBalance: currentBalance,
            newBalance: newBalance,
            message: `This transaction will result in a negative balance of $${Math.abs(newBalance).toFixed(2)} in ${account.name}`
          });
        }
      }

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

          // Update account balances based on journal entries
          for (const entry of transactionData.entries) {
            const account = accountMap.get(entry.accountId);
            if (!account) continue;

            // Calculate balance change based on entry type and account type
            let balanceChange = 0;
            
            // Ensure entry.amount is a number
            const entryAmount = Number(entry.amount);
            
            if (entry.type === EntryType.DEBIT) {
              // For ASSET and EXPENSE accounts, debit increases balance
              // For LIABILITY, INCOME, and EQUITY accounts, debit decreases balance
              if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
                balanceChange = entryAmount;
              } else {
                balanceChange = -entryAmount;
              }
            } else if (entry.type === EntryType.CREDIT) {
              // For ASSET and EXPENSE accounts, credit decreases balance
              // For LIABILITY, INCOME, and EQUITY accounts, credit increases balance
              if (account.type === AccountType.ASSET || account.type === AccountType.EXPENSE) {
                balanceChange = -entryAmount;
              } else {
                balanceChange = entryAmount;
              }
            }

            // Update account balance
            const currentBalance = Number(account.balance || 0);
            const newBalance = currentBalance + balanceChange;
            
            // Safety checks to prevent numeric overflow
            if (isNaN(newBalance) || !isFinite(newBalance)) {
              logError(`Invalid balance calculation for account ${account.name}: current=${currentBalance}, change=${balanceChange}, new=${newBalance}`, 'TransactionService');
              throw new Error(`Invalid balance calculation for account ${account.name}`);
            }
            
            // Check if the new balance would exceed the database field limits (decimal(10,2))
            const maxBalance = 99999999.99; // Maximum value for decimal(10,2)
            if (Math.abs(newBalance) > maxBalance) {
              logError(`Balance would exceed database limits for account ${account.name}: ${newBalance}`, 'TransactionService');
              throw new Error(`Balance would exceed database limits for account ${account.name}`);
            }
            
            // Ensure the balance is a proper number and handle decimal precision
            account.balance = Math.round(newBalance * 100) / 100; // Round to 2 decimal places
            
            await transactionalEntityManager.save(account);
            logSuccess(`Updated account ${account.name} balance: ${account.balance}`, 'TransactionService');
          }

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
          return {
            transaction: fullTransaction,
            warnings: warnings.length > 0 ? warnings : undefined
          };
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
    console.log('🔍 BACKEND DEBUG - Received update data:', JSON.stringify(data, null, 2));

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id },
        relations: ['entries', 'entries.account', 'user']
      });

      if (!transaction) {
        logError(`Transaction not found: ${id}`, 'TransactionService');
        throw new Error(`Transaction with ID ${id} not found`);
      }

      console.log('🔍 BACKEND DEBUG - Original transaction amount:', transaction.amount);
      console.log('🔍 BACKEND DEBUG - Original entry amounts:', transaction.entries.map(e => e.amount));

      return await AppDataSource.transaction(async transactionalEntityManager => {
        // Step 1: Update transaction fields
        transaction.description = data.description;
        transaction.date = data.date;
        transaction.type = data.type;
        transaction.category = data.category;
        transaction.amount = data.amount;

        const updatedTransaction = await transactionalEntityManager.save(transaction);
        logSuccess(`Transaction fields updated: ${updatedTransaction.id}`, 'TransactionService');

        // Step 2: Update journal entries with new amounts
        if (transaction.entries && transaction.entries.length > 0) {
          // Use the amounts provided by the frontend instead of splitting
          // The frontend already provides the correct split amounts
          for (let i = 0; i < transaction.entries.length; i++) {
            const entry = transaction.entries[i];
            // If the frontend provided entry amounts in the data, use those
            // Otherwise, fall back to equal distribution
            let newAmount;
            if (data.entries && data.entries[i]) {
              newAmount = Number(data.entries[i].amount);
              console.log(`🔍 BACKEND DEBUG - Using frontend amount for entry ${i}: ${newAmount}`);
            } else {
              // Fallback to equal distribution
              newAmount = Number(data.amount) / transaction.entries.length;
              console.log(`🔍 BACKEND DEBUG - Using calculated amount for entry ${i}: ${newAmount}`);
            }
            
            const oldAmount = Number(entry.amount);
            entry.amount = newAmount;
            await transactionalEntityManager.save(entry);
            logInfo(`Updated journal entry amount: ${oldAmount} -> ${entry.amount}`, 'TransactionService');
          }
        }

        // Step 3: Recalculate all account balances from scratch
        console.log('🔍 BACKEND DEBUG - Starting balance recalculation...');
        await this.recalculateAccountBalances(transaction.user.id);
        console.log('🔍 BACKEND DEBUG - Balance recalculation complete');

        // Return the updated transaction with entries
        const fullTransaction = await transactionalEntityManager.findOne(Transaction, {
          where: { id: updatedTransaction.id },
          relations: ['entries', 'entries.account', 'user']
        });

        if (!fullTransaction) {
          logError('Failed to retrieve updated transaction', 'TransactionService');
          throw new Error("Failed to retrieve updated transaction");
        }

        logSuccess(`Transaction update complete (ID: ${fullTransaction.id})`, 'TransactionService');
        return fullTransaction;
      });
    } catch (error) {
      logError(`Error updating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async updateTransactionPartial(id: string, updates: Partial<{
    type: TransactionType;
    description: string;
    date: string;
    category: string;
  }>, userId: number): Promise<Transaction> {
    logInfo(`Starting updateTransactionPartial for ID: ${id}`, 'TransactionService');

    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ['entries', 'entries.account']
      });

      if (!transaction) {
        logError(`Transaction not found: ${id}`, 'TransactionService');
        throw new Error(`Transaction with ID ${id} not found`);
      }

      // Update only the provided fields
      if (updates.type) transaction.type = updates.type;
      if (updates.description) transaction.description = updates.description;
      if (updates.date) transaction.date = new Date(updates.date);
      if (updates.category) transaction.category = updates.category;

      // Save the updated transaction
      const updatedTransaction = await this.transactionRepo.save(transaction);
      logSuccess(`Transaction partially updated successfully: ${updatedTransaction.id}`, 'TransactionService');
      return updatedTransaction;
    } catch (error) {
      logError(`Error partially updating transaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async deleteTransaction(id: string, userId: number): Promise<void> {
    logInfo(`Starting deleteTransaction for ID: ${id}`, 'TransactionService');
    
    try {
      const transaction = await this.transactionRepo.findOne({
        where: { id, user: { id: userId } },
        relations: ['entries', 'entries.account']
      });

      if (!transaction) {
        logError(`Transaction not found: ${id}`, 'TransactionService');
        throw new Error(`Transaction with ID ${id} not found`);
      }

      return await AppDataSource.transaction(async transactionalEntityManager => {
        // Reverse account balance changes before deleting entries
        if (transaction.entries && transaction.entries.length > 0) {
          for (const entry of transaction.entries) {
            if (!entry.account) continue;

            // Calculate balance change to reverse (opposite of creation)
            let balanceChange = 0;
            
            // Ensure entry.amount is a number
            const entryAmount = Number(entry.amount);
            
            if (entry.type === EntryType.DEBIT) {
              // For ASSET and EXPENSE accounts, debit increases balance, so reverse decreases it
              // For LIABILITY, INCOME, and EQUITY accounts, debit decreases balance, so reverse increases it
              if (entry.account.type === AccountType.ASSET || entry.account.type === AccountType.EXPENSE) {
                balanceChange = -entryAmount;
              } else {
                balanceChange = entryAmount;
              }
            } else if (entry.type === EntryType.CREDIT) {
              // For ASSET and EXPENSE accounts, credit decreases balance, so reverse increases it
              // For LIABILITY, INCOME, and EQUITY accounts, credit increases balance, so reverse decreases it
              if (entry.account.type === AccountType.ASSET || entry.account.type === AccountType.EXPENSE) {
                balanceChange = entryAmount;
              } else {
                balanceChange = -entryAmount;
              }
            }

            // Update account balance (reverse the change)
            const currentBalance = Number(entry.account.balance || 0);
            const newBalance = currentBalance + balanceChange;
            
            // Safety checks to prevent numeric overflow
            if (isNaN(newBalance) || !isFinite(newBalance)) {
              logError(`Invalid balance calculation for account ${entry.account.name}: current=${currentBalance}, change=${balanceChange}, new=${newBalance}`, 'TransactionService');
              throw new Error(`Invalid balance calculation for account ${entry.account.name}`);
            }
            
            // Check if the new balance would exceed the database field limits (decimal(10,2))
            const maxBalance = 99999999.99; // Maximum value for decimal(10,2)
            if (Math.abs(newBalance) > maxBalance) {
              logError(`Balance would exceed database limits for account ${entry.account.name}: ${newBalance}`, 'TransactionService');
              throw new Error(`Balance would exceed database limits for account ${entry.account.name}`);
            }
            
            // Ensure the balance is a proper number and handle decimal precision
            entry.account.balance = Math.round(newBalance * 100) / 100; // Round to 2 decimal places
            
            logInfo(`Updating account ${entry.account.name} balance: ${currentBalance} + ${balanceChange} = ${entry.account.balance}`, 'TransactionService');
            
            await transactionalEntityManager.save(entry.account);
            logSuccess(`Reversed account ${entry.account.name} balance: ${entry.account.balance}`, 'TransactionService');
          }
        }

        // Delete all associated journal entries
        if (transaction.entries && transaction.entries.length > 0) {
          await transactionalEntityManager.remove(transaction.entries);
          logSuccess(`Deleted ${transaction.entries.length} journal entries`, 'TransactionService');
        }

        // Delete the transaction
        await transactionalEntityManager.remove(transaction);
        logSuccess(`Transaction deleted successfully: ${id}`, 'TransactionService');
      });
    } catch (error) {
      logError(`Error in deleteTransaction: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async suggestAccount(description: string, userId: number): Promise<Account | null> {
    try {
      // Enhanced account suggestion based on description and transaction type
      const accounts = await this.accountRepo.find({
        where: { user: { id: userId } },
        order: { balance: 'DESC' }
      });

      const lowerDescription = description.toLowerCase();
      
      // Simple keyword matching
      if (lowerDescription.includes('cash') || lowerDescription.includes('money')) {
        const cashAccount = accounts.find(acc => acc.name.toLowerCase().includes('cash') || acc.name.toLowerCase().includes('checking'));
        if (cashAccount) return cashAccount;
      }
      
      if (lowerDescription.includes('credit') || lowerDescription.includes('card')) {
        const creditAccount = accounts.find(acc => acc.name.toLowerCase().includes('credit'));
        if (creditAccount) return creditAccount;
      }
      
      if (lowerDescription.includes('savings')) {
        const savingsAccount = accounts.find(acc => acc.name.toLowerCase().includes('savings'));
        if (savingsAccount) return savingsAccount;
      }
      
      // Return the account with highest balance as default
      return accounts[0] || null;
    } catch (error) {
      logError(`Error in suggestAccount: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async getTransactionTemplates(): Promise<any[]> {
    try {
      // This method is now handled by TransactionTemplateService.getAllTemplates()
      return [];
    } catch (error) {
      logError(`Error in getTransactionTemplates: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async suggestTransactionTemplate(description: string, entries: any[]): Promise<any> {
    try {
      return TransactionTemplateService.suggestTemplate(description, entries);
    } catch (error) {
      logError(`Error in suggestTransactionTemplate: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async validateTransactionTemplate(transactionType: TransactionType, entries: any[]): Promise<{ isValid: boolean; errors: string[] }> {
    try {
      return TransactionTemplateService.validateTemplate(transactionType, entries);
    } catch (error) {
      logError(`Error in validateTransactionTemplate: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
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

  async getUniqueCategories(userId: number): Promise<string[]> {
    logInfo(`Getting unique categories for user ${userId}`, 'TransactionService');
    
    try {
      const categories = await this.transactionRepo
        .createQueryBuilder('transaction')
        .select('DISTINCT transaction.category', 'category')
        .leftJoin('transaction.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('transaction.category IS NOT NULL')
        .andWhere("transaction.category != ''")
        .orderBy('transaction.category', 'ASC')
        .getRawMany();

      const categoryList = categories.map((cat: any) => cat.category).filter(Boolean);
      logSuccess(`Found ${categoryList.length} unique categories for user ${userId}`, 'TransactionService');
      return categoryList;
    } catch (error) {
      logError(`Error in getUniqueCategories: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }

  async recalculateAccountBalances(userId: number): Promise<void> {
    logInfo(`Starting account balance recalculation for user ${userId}`, 'TransactionService');
    
    try {
      // Get all accounts for the user
      const accounts = await this.accountRepo.find({
        where: { user: { id: userId } }
      });

      // Reset all account balances to 0
      for (const account of accounts) {
        account.balance = 0;
        await this.accountRepo.save(account);
      }

      // Get all transactions for the user ordered by date
      const transactions = await this.transactionRepo.find({
        where: { user: { id: userId } },
        relations: ['entries', 'entries.account'],
        order: { date: 'ASC' }
      });

      // Process each transaction to update account balances
      for (const transaction of transactions) {
        if (!transaction.entries) continue;

        console.log(`🔍 BACKEND DEBUG - Processing transaction ${transaction.id}: amount=${transaction.amount}, entries=${transaction.entries.length}`);
        
        for (const entry of transaction.entries) {
          if (!entry.account) continue;
          
          console.log(`🔍 BACKEND DEBUG - Entry: account=${entry.account.name}, amount=${entry.amount}, type=${entry.type}`);

          // Calculate balance change based on entry type and account type
          let balanceChange = 0;
          
          // Ensure entry.amount is a number
          const entryAmount = Number(entry.amount);
          
          if (entry.type === EntryType.DEBIT) {
            // For ASSET and EXPENSE accounts, debit increases balance
            // For LIABILITY, INCOME, and EQUITY accounts, debit decreases balance
            if (entry.account.type === AccountType.ASSET || entry.account.type === AccountType.EXPENSE) {
              balanceChange = entryAmount;
            } else {
              balanceChange = -entryAmount;
            }
          } else if (entry.type === EntryType.CREDIT) {
            // For ASSET and EXPENSE accounts, credit decreases balance
            // For LIABILITY, INCOME, and EQUITY accounts, credit increases balance
            if (entry.account.type === AccountType.ASSET || entry.account.type === AccountType.EXPENSE) {
              balanceChange = -entryAmount;
            } else {
              balanceChange = entryAmount;
            }
          }

          // Update account balance
          const currentBalance = Number(entry.account.balance || 0);
          const newBalance = currentBalance + balanceChange;
          
          console.log(`🔍 BACKEND DEBUG - Balance calculation: ${currentBalance} + ${balanceChange} = ${newBalance}`);
          
          // Safety checks to prevent numeric overflow
          if (isNaN(newBalance) || !isFinite(newBalance)) {
            logError(`Invalid balance calculation for account ${entry.account.name}: current=${currentBalance}, change=${balanceChange}, new=${newBalance}`, 'TransactionService');
            throw new Error(`Invalid balance calculation for account ${entry.account.name}`);
          }
          
          // Check if the new balance would exceed the database field limits (decimal(10,2))
          const maxBalance = 99999999.99; // Maximum value for decimal(10,2)
          if (Math.abs(newBalance) > maxBalance) {
            logError(`Balance would exceed database limits for account ${entry.account.name}: ${newBalance}`, 'TransactionService');
            throw new Error(`Balance would exceed database limits for account ${entry.account.name}`);
          }
          
          // Ensure the balance is a proper number and handle decimal precision
          entry.account.balance = Math.round(newBalance * 100) / 100; // Round to 2 decimal places
          
          logInfo(`Updating account ${entry.account.name} balance: ${currentBalance} + ${balanceChange} = ${entry.account.balance}`, 'TransactionService');
          
          await this.accountRepo.save(entry.account);
          logSuccess(`Updated account ${entry.account.name} balance: ${entry.account.balance}`, 'TransactionService');
        }
      }

      logSuccess(`Account balance recalculation completed for user ${userId}`, 'TransactionService');
    } catch (error) {
      logError(`Error in recalculateAccountBalances: ${error instanceof Error ? error.message : 'Unknown error'}`, 'TransactionService');
      throw error;
    }
  }
} 