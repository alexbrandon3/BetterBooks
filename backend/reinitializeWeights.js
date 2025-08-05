const { AppDataSource } = require("./dist/config/data-source");
const { AccountWeight } = require("./dist/entities/AccountWeight");
const { Account } = require("./dist/entities/Account");

async function reinitializeWeights() {
  try {
    await AppDataSource.initialize();
    console.log('🔄 Reinitializing weights for user 14...');

    const accountWeightRepo = AppDataSource.getRepository(AccountWeight);
    const accountRepo = AppDataSource.getRepository(Account);

    // Delete existing weights for user 14
    await accountWeightRepo.delete({ userId: 14 });
    console.log('✅ Deleted existing weights');

    // Get user's accounts
    const userAccounts = await accountRepo.find({
      where: { user: { id: 14 } }
    });

    console.log(`📋 Found ${userAccounts.length} accounts for user 14`);

    // Reinitialize with the fixed logic
    const { AccountWeightService } = require("./dist/services/AccountWeightService");
    const accountWeightService = new AccountWeightService();
    
    await accountWeightService.initializeDefaultWeights(14);
    console.log('✅ Weights reinitialized with fix!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

reinitializeWeights(); 