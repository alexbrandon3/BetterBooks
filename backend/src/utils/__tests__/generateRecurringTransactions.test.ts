import { AppDataSource } from '../../data-source';
import { generateRecurringTransactions } from '../generateRecurringTransactions';
import { RecurringTransaction } from '../../entities/RecurringTransaction';
import { Transaction } from '../../entities/Transaction';
import { User } from '../../entities/User';
import { Account } from '../../entities/Account';
import { TransactionType } from '../../entities/Transaction';

describe('generateRecurringTransactions', () => {
  let user: User;
  let account: Account;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await AppDataSource.initialize();

    // Create test user
    user = AppDataSource.getRepository(User).create({
      email: 'test@example.com',
      password: 'hashedpassword',
    });
    await AppDataSource.getRepository(User).save(user);

    // Create test account
    account = AppDataSource.getRepository(Account).create({
      number: '123456789',
      name: 'Test Checking',
      description: 'Test Account',
      type: 'Asset',
      subtype: 'Checking',
      balance: 0,
      user,
    });
    await AppDataSource.getRepository(Account).save(account);
  });

  afterAll(async () => {
    await AppDataSource.dropDatabase(); // wipe test DB
    await AppDataSource.destroy();
  });

  it('should generate a transaction from a due recurring transaction', async () => {
    const recurrence = AppDataSource.getRepository(RecurringTransaction).create({
      description: 'Recurring Income Test',
      amount: 200,
      type: 'Income',
      reference: 'REC-001',
      isActive: true,
      recurrence: 'Monthly',
      startDate: new Date(),
      nextRun: new Date(),
      interval: 1,
      frequency: 'Monthly',
      account,
      user,
    });

    await AppDataSource.getRepository(RecurringTransaction).save(recurrence);

    await generateRecurringTransactions();

    const transactions = await AppDataSource.getRepository(Transaction).find({
      where: { user: { id: user.id } },
    });

    expect(Number(transactions[0].amount)).toBe(200); // ✅ Good to go!
    expect(transactions[0].description).toBe('Recurring Income Test');
    expect(Number(transactions[0].amount)).toBe(200); // ✅ This is correct
    expect(transactions[0].type).toBe(TransactionType.INCOME);
  });
});
