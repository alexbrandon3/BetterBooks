import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { JournalEntry } from "../entities/JournalEntry";
import { EntryType } from "../types/journal.types";
import { AccountType, FinancialCategory } from "../entities/Account";
import { TransactionType } from "../types/transaction.types";
import bcrypt from 'bcryptjs';

async function seedTransactions() {
  try {
    console.log('🌱 Starting transaction seed...');
    await AppDataSource.initialize();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      user = userRepo.create({
        email: 'demo@demo.com',
        password: hashedPassword,
      });
      await userRepo.save(user);
      console.log('✅ Created test user:', user.email);
    }

    // Create accounts
    const accountRepo = AppDataSource.getRepository(Account);
    const accounts = await accountRepo.save([
      {
        name: 'Cash',
        type: AccountType.ASSET,
        balance: 0,
        user,
        category: 'Current Assets',
        subcategory: 'Cash',
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: 'CASH'
      },
      {
        name: 'Revenue',
        type: AccountType.REVENUE,
        balance: 0,
        user,
        category: 'Operating Revenue',
        subcategory: 'Sales',
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: 'SALES'
      },
      {
        name: 'Utilities',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Operating Expenses',
        subcategory: 'Utilities',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'UTILITIES'
      }
    ]);
    console.log('✅ Created accounts:', accounts.map(a => a.name));

    // Create transactions
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const journalEntryRepo = AppDataSource.getRepository(JournalEntry);

    const transactions = [
      {
        description: 'Sales Revenue',
        type: TransactionType.INCOME,
        entries: [
          { account: accounts[0], type: EntryType.DEBIT, amount: 1000 }, // Cash
          { account: accounts[1], type: EntryType.CREDIT, amount: 1000 } // Revenue
        ]
      },
      {
        description: 'Utility Bill',
        type: TransactionType.EXPENSE,
        entries: [
          { account: accounts[2], type: EntryType.DEBIT, amount: 200 }, // Utilities
          { account: accounts[0], type: EntryType.CREDIT, amount: 200 } // Cash
        ]
      },
      {
        description: 'Additional Sales',
        type: TransactionType.INCOME,
        entries: [
          { account: accounts[0], type: EntryType.DEBIT, amount: 500 }, // Cash
          { account: accounts[1], type: EntryType.CREDIT, amount: 500 } // Revenue
        ]
      }
    ];

    for (const txData of transactions) {
      // Create transaction
      const transaction = transactionRepo.create({
        description: txData.description,
        startDate: new Date(),
        type: txData.type,
        user
      });
      await transactionRepo.save(transaction);

      // Create journal entries
      const entries = txData.entries.map(entry => 
        journalEntryRepo.create({
          amount: entry.amount,
          type: entry.type,
          account: entry.account,
          transaction,
          user
        })
      );
      await journalEntryRepo.save(entries);

      console.log(`✅ Created transaction "${txData.description}" with ${entries.length} entries`);
    }

    // Verify transactions
    const savedTransactions = await transactionRepo.find({
      where: { user: { id: user.id } },
      relations: ['entries', 'entries.account']
    });

    console.log('\n📊 Verification Results:');
    console.log('------------------------');
    savedTransactions.forEach(tx => {
      console.log(`\nTransaction: ${tx.description}`);
      console.log('Entries:');
      tx.entries.forEach(entry => {
        console.log(`  - ${entry.type}: ${entry.amount} (${entry.account.name})`);
      });
    });

    console.log('\n✅ Seed completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedTransactions(); 