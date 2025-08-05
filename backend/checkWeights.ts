import { AppDataSource } from "./src/config/data-source";
import { AccountWeight } from "./src/entities/AccountWeight";
import { Account } from "./src/entities/Account";

async function checkWeights() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Checking weights for user 14...');

    const accountWeightRepo = AppDataSource.getRepository(AccountWeight);
    const accountRepo = AppDataSource.getRepository(Account);

    // Get all weights for user 14
    const weights = await accountWeightRepo.find({
      where: { userId: 14 },
      relations: ['account']
    });

    console.log(`\n📋 Found ${weights.length} weights for user 14`);

    // Check for initial_contribution specifically
    const initialContributionWeights = weights.filter(w => w.keyword.includes('contribution'));
    console.log('\n🔍 Initial contribution weights:');
    initialContributionWeights.forEach(w => {
      console.log(`  ${w.keyword} → ${w.account?.name} (${w.account?.type}) - ${w.weight}% - ${w.transactionType}`);
    });

    // Check for equipment weights
    const equipmentWeights = weights.filter(w => w.keyword.includes('equipment'));
    console.log('\n🔍 Equipment weights:');
    equipmentWeights.forEach(w => {
      console.log(`  ${w.keyword} → ${w.account?.name} (${w.account?.type}) - ${w.weight}% - ${w.transactionType}`);
    });

    // Show all accounts for user 14
    const accounts = await accountRepo.find({
      where: { user: { id: 14 } }
    });

    console.log('\n📋 User 14 Accounts:');
    accounts.forEach(account => {
      console.log(`  - ${account.name} (ID: ${account.id}, Type: ${account.type})`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkWeights(); 