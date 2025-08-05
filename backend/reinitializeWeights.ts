import { AppDataSource } from './src/config/data-source';
import { AccountWeightService } from './src/services/AccountWeightService';

async function reinitializeWeights() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const accountWeightService = new AccountWeightService();
    
    // Get user ID from command line argument
    const userId = process.argv[2] ? parseInt(process.argv[2]) : null;
    
    if (!userId) {
      console.log('❌ Please provide a user ID as an argument:');
      console.log('   npx ts-node reinitializeWeights.ts <USER_ID>');
      console.log('');
      console.log('Example: npx ts-node reinitializeWeights.ts 14');
      return;
    }

    console.log(`🔧 Reinitializing weights for user ID: ${userId}`);

    // Delete existing weights
    const existingWeights = await accountWeightService.getUserWeights(userId);
    console.log(`📊 Found ${existingWeights.length} existing weights for user ${userId}`);
    
    if (existingWeights.length > 0) {
      console.log('🗑️  Deleting existing weights...');
      
      // Delete each weight
      for (const weight of existingWeights) {
        await accountWeightService.deleteWeight(weight.id, userId);
      }
      
      console.log(`✅ Deleted ${existingWeights.length} existing weights`);
    }

    // Initialize new weights
    console.log('🔧 Initializing new weights...');
    await accountWeightService.initializeDefaultWeights(userId);
    
    // Verify the weights were created
    const newWeights = await accountWeightService.getUserWeights(userId);
    console.log(`✅ Successfully initialized ${newWeights.length} new weights for user ${userId}`);

    // Show some examples by category
    const categories = {
      'Employee Payments': newWeights.filter(w => 
        w.keyword.includes('payroll') || w.keyword.includes('salary') || w.keyword.includes('employee') ||
        w.keyword.includes('bonus') || w.keyword.includes('commission')
      ),
      'Contractor Payments': newWeights.filter(w => 
        w.keyword.includes('contractor') || w.keyword.includes('freelancer') || w.keyword.includes('consultant') ||
        w.keyword.includes('vendor') || w.keyword.includes('service')
      ),
      'Equity & Contributions': newWeights.filter(w => 
        w.keyword.includes('contribution') || w.keyword.includes('investment') || w.keyword.includes('equity') ||
        w.keyword.includes('capital') || w.keyword.includes('draw')
      ),
      'Tax Keywords': newWeights.filter(w => 
        w.keyword.includes('tax') || w.keyword.includes('withholding') || w.keyword.includes('deductions')
      )
    };

    console.log('\n📋 Sample weights by category:');
    for (const [category, weights] of Object.entries(categories)) {
      if (weights.length > 0) {
        console.log(`\n${category}:`);
        weights.slice(0, 3).forEach(w => {
          console.log(`   - ${w.keyword} → Account ID: ${w.accountId} (${w.weight}%)`);
        });
      }
    }

    console.log('\n🎉 Weights reinitialized successfully!');
    console.log('   You can now test Smart Suggestions with all the new keywords.');

  } catch (error) {
    console.error('❌ Failed to reinitialize weights:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

reinitializeWeights(); 