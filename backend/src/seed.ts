import { AppDataSource } from "./config/data-source";
import { User } from "./entities/User";
import { Account, AccountType, FinancialCategory } from "./entities/Account";
import { Transaction } from "./entities/Transaction";
import { JournalEntry, EntryType } from "./entities/JournalEntry";
import * as bcrypt from "bcrypt";

async function main() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log("Database connection initialized");

    // Create test user
    const hashedPassword = await bcrypt.hash("password", 10);
    const user = new User();
    user.email = "test@example.com";
    user.password = hashedPassword;
    await AppDataSource.manager.save(user);
    console.log("Test user created");

    // Create accounts
    const cashAccount = new Account();
    cashAccount.name = "Cash";
    cashAccount.type = AccountType.ASSET;
    cashAccount.financialCategory = FinancialCategory.CURRENT_ASSET;
    cashAccount.balance = 0;
    cashAccount.user = user;
    await AppDataSource.manager.save(cashAccount);
    console.log("Cash account created");

    const salesAccount = new Account();
    salesAccount.name = "Sales Revenue";
    salesAccount.type = AccountType.REVENUE;
    salesAccount.financialCategory = FinancialCategory.OPERATING_EXPENSE;
    salesAccount.balance = 0;
    salesAccount.user = user;
    await AppDataSource.manager.save(salesAccount);
    console.log("Sales Revenue account created");

    // Create a sample transaction
    const transaction = new Transaction();
    transaction.description = "Sample Sale";
    transaction.startDate = new Date();
    transaction.user = user;
    await AppDataSource.manager.save(transaction);
    console.log("Transaction created");

    // Create journal entries
    const cashEntry = new JournalEntry();
    cashEntry.amount = 953.85;
    cashEntry.type = EntryType.DEBIT;
    cashEntry.account = cashAccount;
    cashEntry.user = user;
    cashEntry.transaction = transaction;
    await AppDataSource.manager.save(cashEntry);
    console.log("Cash journal entry created");

    const salesEntry = new JournalEntry();
    salesEntry.amount = 953.85;
    salesEntry.type = EntryType.CREDIT;
    salesEntry.account = salesAccount;
    salesEntry.user = user;
    salesEntry.transaction = transaction;
    await AppDataSource.manager.save(salesEntry);
    console.log("Sales journal entry created");

    // Update account balances
    cashAccount.balance += 953.85;
    salesAccount.balance -= 953.85;
    await AppDataSource.manager.save([cashAccount, salesAccount]);
    console.log("Account balances updated");

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

main(); 