import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account, AccountType, FinancialCategory } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { JournalEntry, EntryType } from "../entities/JournalEntry";
import { TransactionType } from "../types/transaction.types";
import bcrypt from 'bcryptjs';

async function seedDashboard() {
  try {
    console.log('🌱 Starting dashboard seed...');
    await AppDataSource.initialize();

    // Create or get demo user
    const userRepo = AppDataSource.getRepository(User);
    let user = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      user = userRepo.create({
        email: 'demo@demo.com',
        password: hashedPassword,
      });
      await userRepo.save(user);
      console.log('✅ Created demo user:', user.email);
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
        name: 'Accounts Receivable',
        type: AccountType.ASSET,
        balance: 0,
        user,
        category: 'Current Assets',
        subcategory: 'Receivables',
        financialCategory: FinancialCategory.CURRENT_ASSET,
        financialSubcategory: 'RECEIVABLES'
      },
      {
        name: 'Sales Revenue',
        type: AccountType.INCOME,
        balance: 0,
        user,
        category: 'Operating Revenue',
        subcategory: 'Sales',
        financialCategory: FinancialCategory.OPERATING_REVENUE,
        financialSubcategory: 'SALES'
      },
      {
        name: 'Marketing Expense',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Operating Expenses',
        subcategory: 'Marketing',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'MARKETING'
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

    // Create transactions with entries
    const transactionRepo = AppDataSource.getRepository(Transaction);
    const journalEntryRepo = AppDataSource.getRepository(JournalEntry);

    const transactions = [
      {
        description: 'Monthly Sales',
        type: TransactionType.INCOME,
        entries: [
          { account: accounts[0], type: EntryType.DEBIT, amount: 5000 }, // Cash
          { account: accounts[2], type: EntryType.CREDIT, amount: 5000 } // Sales Revenue
        ]
      },
      {
        description: 'Marketing Campaign',
        type: TransactionType.EXPENSE,
        entries: [
          { account: accounts[3], type: EntryType.DEBIT, amount: 1000 }, // Marketing Expense
          { account: accounts[0], type: EntryType.CREDIT, amount: 1000 } // Cash
        ]
      },
      {
        description: 'Utility Bill',
        type: TransactionType.EXPENSE,
        entries: [
          { account: accounts[4], type: EntryType.DEBIT, amount: 300 }, // Utilities
          { account: accounts[0], type: EntryType.CREDIT, amount: 300 } // Cash
        ]
      },
      {
        description: 'Credit Sale',
        type: TransactionType.INCOME,
        entries: [
          { account: accounts[1], type: EntryType.DEBIT, amount: 2000 }, // Accounts Receivable
          { account: accounts[2], type: EntryType.CREDIT, amount: 2000 } // Sales Revenue
        ]
      }
    ];

    for (const txData of transactions) {
      // Calculate total amount from entries
      const totalAmount = txData.entries.reduce((sum, entry) => sum + entry.amount, 0);
      
      // Create transaction
      const transaction = transactionRepo.create({
        description: txData.description,
        amount: totalAmount,
        type: txData.type,
        category: 'Uncategorized',
        date: new Date(),
        user: user
      });
      await transactionRepo.save(transaction);

      // Create journal entries and update account balances
      for (const entry of txData.entries) {
        // Create the journal entry
        const journalEntry = journalEntryRepo.create({
          amount: entry.amount,
          type: entry.type,
          account: entry.account,
          transaction,
          user
        });
        await journalEntryRepo.save(journalEntry);

        // Update account balance
        const account = entry.account;
        const adjustment = entry.type === 'DEBIT' ? entry.amount : -entry.amount;
        account.balance = parseFloat((Number(account.balance) + adjustment).toFixed(2));
        await accountRepo.save(account);

        console.log(`💰 Updated ${account.name} balance:`, {
          entryType: entry.type,
          amount: entry.amount,
          adjustment,
          newBalance: account.balance
        });
      }

      console.log(`✅ Created transaction "${txData.description}" with ${txData.entries.length} entries`);
    }

    // Verify final account balances
    const finalAccounts = await accountRepo.find({
      where: { user: { id: user.id } }
    });

    console.log('\n📊 Final Account Balances:');
    console.log('------------------------');
    finalAccounts.forEach(account => {
      console.log(`${account.name}: ${account.balance}`);
    });

    console.log('\n✅ Seed completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedDashboard(); 