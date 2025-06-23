import { AppDataSource } from '../config/data-source';
import { Account } from '../entities/Account';
import { JournalEntry } from '../entities/JournalEntry';
import { logError } from '../utils/logger';

async function fixCorruptedBalances() {
  try {
    await AppDataSource.initialize();
    console.log('🔧 Starting balance repair...');

    // Get all accounts
    const accountRepository = AppDataSource.getRepository(Account);
    const accounts = await accountRepository.find();
    
    console.log(`📊 Found ${accounts.length} accounts to check`);

    for (const account of accounts) {
      console.log(`\n🔍 Checking account: ${account.name} (ID: ${account.id})`);
      
      // Get all journal entries for this account
      const journalEntryRepository = AppDataSource.getRepository(JournalEntry);
      const entries = await journalEntryRepository.find({
        where: { account: { id: account.id } },
        relations: ['transaction']
      });

      console.log(`  📝 Found ${entries.length} journal entries`);

      // Calculate balance from journal entries
      let calculatedBalance = 0;
      for (const entry of entries) {
        const amount = parseFloat(entry.amount.toString());
        if (isNaN(amount)) {
          console.warn(`  ⚠️ Invalid amount in journal entry ${entry.id}: ${entry.amount}`);
          continue;
        }

        if (entry.type === 'DEBIT') {
          calculatedBalance += amount;
        } else if (entry.type === 'CREDIT') {
          calculatedBalance -= amount;
        }
      }

      // Round to 2 decimal places
      calculatedBalance = Math.round(calculatedBalance * 100) / 100;

      console.log(`  💰 Calculated balance: ${calculatedBalance}`);
      console.log(`  💰 Stored balance: ${account.balance}`);

      // Check if balance needs to be updated
      const storedBalance = parseFloat(account.balance.toString());
      if (isNaN(storedBalance) || Math.abs(storedBalance - calculatedBalance) > 0.01) {
        console.log(`  🔧 Updating balance from ${storedBalance} to ${calculatedBalance}`);
        
        // Safety check: ensure balance doesn't exceed database limits
        if (calculatedBalance > 999999999.99) {
          console.warn(`  ⚠️ Balance too large, capping at 999,999,999.99`);
          calculatedBalance = 999999999.99;
        } else if (calculatedBalance < -999999999.99) {
          console.warn(`  ⚠️ Balance too negative, capping at -999,999,999.99`);
          calculatedBalance = -999999999.99;
        }

        account.balance = calculatedBalance;
        await accountRepository.save(account);
        console.log(`  ✅ Balance updated successfully`);
      } else {
        console.log(`  ✅ Balance is correct`);
      }
    }

    console.log('\n🎉 Balance repair completed successfully!');
  } catch (error) {
    console.error('❌ Error during balance repair:', error);
    logError(`Error during balance repair: ${error instanceof Error ? error.message : 'Unknown error'}`, 'FixCorruptedBalances');
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

// Run the script if called directly
if (require.main === module) {
  fixCorruptedBalances()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixCorruptedBalances }; 