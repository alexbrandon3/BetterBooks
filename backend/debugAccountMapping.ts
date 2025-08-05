import { AppDataSource } from "./src/config/data-source";
import { Account } from "./src/entities/Account";
import { AccountWeightService } from "./src/services/AccountWeightService";

async function debugAccountMapping() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Debugging account mapping for "initial_contribution"...');

    const accountRepo = AppDataSource.getRepository(Account);
    const accountWeightService = new AccountWeightService();

    // Get user 14's accounts
    const userAccounts = await accountRepo.find({
      where: { user: { id: 14 } }
    });

    console.log('\n📋 User 14 Accounts:');
    userAccounts.forEach(account => {
      console.log(`  - ${account.name} (ID: ${account.id}, Type: ${account.type})`);
    });

    // Test the findMatchingAccount logic
    console.log('\n🔍 Testing "initial_contribution" mapping:');
    const testWeight = {
      keyword: "initial_contribution",
      accountId: 0,
      weight: 95,
      transactionType: "EQUITY"
    };

    const matchingAccount = accountWeightService['findMatchingAccount'](userAccounts, testWeight);
    
    if (matchingAccount) {
      console.log(`✅ Matched: ${matchingAccount.name} (ID: ${matchingAccount.id}, Type: ${matchingAccount.type})`);
    } else {
      console.log('❌ No match found');
    }

    // Test other equity keywords
    console.log('\n🔍 Testing equity keywords:');
    const equityKeywords = ['contribution', 'investment', 'equity', 'capital', 'owner', 'partner'];
    
    equityKeywords.forEach(keyword => {
      const testWeight = {
        keyword,
        accountId: 0,
        weight: 90,
        transactionType: "EQUITY"
      };
      
      const match = accountWeightService['findMatchingAccount'](userAccounts, testWeight);
      if (match) {
        console.log(`  ${keyword} → ${match.name} (${match.type})`);
      } else {
        console.log(`  ${keyword} → No match`);
      }
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugAccountMapping(); 