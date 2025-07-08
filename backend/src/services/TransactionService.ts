import { AppDataSource } from '../config/data-source';
import { Transaction } from '../entities/Transaction';
import { JournalEntry } from '../entities/JournalEntry';
import { TransactionType, EntryType } from '../types/transaction.types';
import { User } from '../entities/User';


export interface TransactionForm {
  type: TransactionType;
  description: string;
  date: string;
  entries: JournalEntryFields[];
}

export interface JournalEntryFields {
  accountId: string;
  amount: string;
  type: EntryType;
}

export interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: number;
  search?: string;
}

export class TransactionService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private journalEntryRepo = AppDataSource.getRepository(JournalEntry);
  private userRepo = AppDataSource.getRepository(User);

  static async fetchTransactions(userId: string, options: TransactionQueryOptions = {}): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      type,
      accountId,
      search
    } = options;

    const queryBuilder = AppDataSource.manager
      .createQueryBuilder(Transaction, 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .leftJoinAndSelect('entries.account', 'account')
      .leftJoinAndSelect('transaction.user', 'user')
      .where('user.id = :userId', { userId: Number(userId) });

    // Add date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere('transaction.date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      });
    } else if (startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', { endDate });
    }

    // Add type filter
    if (type) {
      queryBuilder.andWhere('transaction.type = :type', { type });
    }

    // Add account filter
    if (accountId) {
      queryBuilder.andWhere('entries.account.id = :accountId', { accountId });
    }

    // Add search filter
    if (search) {
      queryBuilder.andWhere('transaction.description ILIKE :search', { search: `%${search}%` });
    }

    // Add ordering and pagination
    queryBuilder
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Get total count for pagination
    const countQuery = queryBuilder.clone();
    const total = await countQuery.getCount();

    // Execute the main query
    const transactions = await queryBuilder.getMany();

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Optimized method for dashboard - only fetch recent transactions
  static async fetchRecentTransactions(userId: string, limit: number = 10): Promise<Transaction[]> {
    return AppDataSource.manager
      .createQueryBuilder(Transaction, 'transaction')
      .leftJoinAndSelect('transaction.entries', 'entries')
      .leftJoinAndSelect('entries.account', 'account')
      .where('transaction.user.id = :userId', { userId: Number(userId) })
      .orderBy('transaction.date', 'DESC')
      .addOrderBy('transaction.id', 'DESC')
      .take(limit)
      .getMany();
  }

  // Optimized method for account balance calculations
  static async getAccountBalances(userId: string): Promise<Map<number, number>> {
    const balances = await AppDataSource.manager
      .createQueryBuilder(JournalEntry, 'entry')
      .select('entry.account.id', 'accountId')
      .addSelect('SUM(CASE WHEN entry.type = :debit THEN entry.amount ELSE -entry.amount END)', 'balance')
      .where('entry.user.id = :userId', { userId: Number(userId) })
      .groupBy('entry.account.id')
      .getRawMany();

    const balanceMap = new Map<number, number>();
    balances.forEach(({ accountId, balance }) => {
      balanceMap.set(Number(accountId), Number(balance) || 0);
    });

    return balanceMap;
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return AppDataSource.manager.find(Transaction, {
      where: { user: { id: userId } },
      relations: ['entries', 'entries.account']
    });
  }

  async createTransaction(data: any): Promise<Transaction> {
    const user = await this.userRepo.findOne({ where: { id: Number(data.userId) } });
    if (!user) {
      throw new Error('User not found');
    }

    const transaction = this.transactionRepo.create({
      description: data.description,
      date: data.date,
      user
    });

    const savedTransaction = await this.transactionRepo.save(transaction);

    const entries = data.entries.map((entry: any) => 
      this.journalEntryRepo.create({
        amount: entry.amount,
        type: entry.type,
        account: { id: Number(entry.accountId) },
        user,
        transaction: savedTransaction
      })
    );

    const savedEntries = await this.journalEntryRepo.save(entries);
    savedTransaction.entries = savedEntries;

    return savedTransaction;
  }

  async updateTransaction(id: string, userId: number, data: any): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['entries']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    Object.assign(transaction, data);
    const updatedTransaction = await this.transactionRepo.save(transaction);

    return updatedTransaction;
  }

  async deleteTransaction(id: string, userId: number): Promise<void> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, user: { id: userId } },
      relations: ['entries']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // First delete all associated journal entries
    if (transaction.entries && transaction.entries.length > 0) {
      await this.journalEntryRepo.remove(transaction.entries);
    }

    // Then delete the transaction
    await this.transactionRepo.remove(transaction);
  }

  // Additional methods for controller compatibility
  async getSuggestedAccount(_description: string): Promise<{ suggestedAccountId: number } | null> {
    // TODO: Implement account suggestion logic
    return null;
  }

  async getRecurringTransactions(): Promise<any[]> {
    // TODO: Implement recurring transactions
    return [];
  }

  async getTransactionTemplates(): Promise<any[]> {
    // TODO: Implement transaction templates
    return [];
  }

  async suggestTransactionTemplate(_description: string, _entries: any[]): Promise<any> {
    // TODO: Implement template suggestion
    return null;
  }

  async validateTransactionTemplate(_transactionType: string, _entries: any[]): Promise<{ isValid: boolean; errors: string[] }> {
    // TODO: Implement template validation
    return { isValid: true, errors: [] };
  }
} 