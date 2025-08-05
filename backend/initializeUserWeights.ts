import { AppDataSource } from './src/config/data-source';
import { AccountWeightService } from './src/services/AccountWeightService';

async function initializeUserWeights() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const accountWeightService = new AccountWeightService();
    
    // Get user ID from command line argument or prompt
    const userId = process.argv[2] ? parseInt(process.argv[2]) : null;
    
    if (!userId) {
      console.log('❌ Please provide a user ID as an argument:');
      console.log('   npx ts-node initializeUserWeights.ts <USER_ID>');
      console.log('');
      console.log('Example: npx ts-node initializeUserWeights.ts 123');
      return;
    }

    console.log(`🔧 Initializing default weights for user ID: ${userId}`);

    // First, check if weights already exist
    const existingWeights = await accountWeightService.getUserWeights(userId);
    console.log(`📊 Found ${existingWeights.length} existing weights for user ${userId}`);

    if (existingWeights.length > 0) {
      console.log('⚠️  User already has weights initialized. Skipping...');
      console.log('   If you want to reinitialize, delete existing weights first.');
      return;
    }

    // Initialize default weights
    await accountWeightService.initializeDefaultWeights(userId);
    
    // Verify the weights were created
    const newWeights = await accountWeightService.getUserWeights(userId);
    console.log(`✅ Successfully initialized ${newWeights.length} default weights for user ${userId}`);

    // Show some equity-related weights as examples
    const equityWeights = newWeights.filter(w => 
      w.keyword.includes('contribution') || 
      w.keyword.includes('investment') || 
      w.keyword.includes('equity')
    );

    console.log('\n📋 Sample equity weights created:');
    equityWeights.slice(0, 5).forEach(w => {
      console.log(`   - ${w.keyword} → Account ID: ${w.accountId} (${w.weight}%)`);
    });

    console.log('\n🎉 Default weights initialized successfully!');
    console.log('   You can now test Smart Suggestions with equity phrases.');

  } catch (error) {
    console.error('❌ Failed to initialize weights:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

initializeUserWeights(); 