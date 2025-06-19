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

export class TransactionService {
  private transactionRepo = AppDataSource.getRepository(Transaction);
  private journalEntryRepo = AppDataSource.getRepository(JournalEntry);
  private userRepo = AppDataSource.getRepository(User);

  static async fetchTransactions(userId: string): Promise<Transaction[]> {
    return AppDataSource.manager.find(Transaction, {
      where: { user: { id: Number(userId) } },
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

  async updateTransaction(id: string, userId: string, data: any): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, user: { id: Number(userId) } },
      relations: ['entries']
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    Object.assign(transaction, data);
    return await this.transactionRepo.save(transaction);
  }

  async deleteTransaction(id: string, userId: string): Promise<void> {
    const transaction = await this.transactionRepo.findOne({
      where: { id, user: { id: Number(userId) } },
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

  // static async getSuggestedAccount(description: string): Promise<{ suggestedAccountId: number } | null> {
  //   // TODO: Implement account suggestion logic
  //   return null;
  // }
} 