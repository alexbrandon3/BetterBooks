const { AppDataSource } = require("./dist/config/data-source");
const { AccountWeight } = require("./dist/entities/AccountWeight");
const { Account } = require("./dist/entities/Account");

async function checkNewUserWeights() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Checking weights for new user...');

    const accountWeightRepo = AppDataSource.getRepository(AccountWeight);
    const accountRepo = AppDataSource.getRepository(Account);

    // Get all users to find the newest one
    const { User } = require("./dist/entities/User");
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find({
      order: { id: 'DESC' },
      take: 5
    });

    console.log('\n📋 Recent users:');
    users.forEach(user => {
      console.log(`  - User ID: ${user.id}, Email: ${user.email}`);
    });

    // Check the newest user
    const newestUser = users[0];
    console.log(`\n🔍 Checking weights for newest user (ID: ${newestUser.id})`);

    // Get all weights for the newest user
    const weights = await accountWeightRepo.find({
      where: { userId: newestUser.id },
      relations: ['account']
    });

    console.log(`\n📋 Found ${weights.length} weights for user ${newestUser.id}`);

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

    // Show all accounts for the newest user
    const accounts = await accountRepo.find({
      where: { user: { id: newestUser.id } }
    });

    console.log('\n📋 Newest User Accounts:');
    accounts.forEach(account => {
      console.log(`  - ${account.name} (ID: ${account.id}, Type: ${account.type})`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkNewUserWeights(); 