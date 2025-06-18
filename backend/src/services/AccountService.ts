import { AppDataSource } from '../config/data-source';
import { Account } from '../entities/Account';

export class AccountService {
  static async getAccounts(userId: string): Promise<Account[]> {
    return AppDataSource.manager.find(Account, {
      where: { user: { id: Number(userId) } }
    });
  }
} 