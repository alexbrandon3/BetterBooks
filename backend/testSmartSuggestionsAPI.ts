import { AppDataSource } from './src/config/data-source';
import { AccountWeightService } from './src/services/AccountWeightService';

async function testSmartSuggestionsAPI() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const accountWeightService = new AccountWeightService();
    const testUserId = 1;

    console.log('\n🧪 Testing Smart Suggestions API...\n');

    // Test 1: Initialize default weights
    console.log('1️⃣ Initializing default weights...');
    await accountWeightService.initializeDefaultWeights(testUserId);
    console.log('✅ Default weights initialized');

    // Test 2: Get user weights with account names
    console.log('\n2️⃣ Getting user weights with account names...');
    const weights = await accountWeightService.getUserWeights(testUserId);
    console.log(`✅ Found ${weights.length} weights:`);
    weights.forEach((weight: any) => {
      console.log(`   - "${weight.keyword}" → "${weight.accountName}" (weight: ${weight.weight}, usage: ${weight.usageCount})`);
    });

    // Test 3: Create a new weight
    console.log('\n3️⃣ Creating a new custom weight...');
    const newWeight = await accountWeightService.createOrUpdateWeight(testUserId, {
      keyword: 'test',
      accountId: 1, // Cash account
      weight: 75,
      transactionType: 'EXPENSE',
      isDefault: false
    });
    console.log('✅ Custom weight created:', newWeight);

    // Test 4: Get updated weights
    console.log('\n4️⃣ Getting updated weights...');
    const updatedWeights = await accountWeightService.getUserWeights(testUserId);
    console.log(`✅ Found ${updatedWeights.length} weights after adding custom one`);

    // Test 5: Delete the test weight
    console.log('\n5️⃣ Deleting test weight...');
    await accountWeightService.deleteWeight(newWeight.id, testUserId);
    console.log('✅ Test weight deleted');

    console.log('\n🎉 Smart Suggestions API test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

testSmartSuggestionsAPI(); 