import { AppDataSource } from './src/config/data-source';
import { Account } from './src/entities/Account';
import { getSuggestedMetadata } from './src/utils/accountCategorizer';

async function testInterestExpenseCreation() {
  try {
    await AppDataSource.initialize();
    
    console.log('🧪 Testing Interest Expense account creation...');
    
    // Test the smart suggestion system
    const suggestedMetadata = getSuggestedMetadata('Interest Expense');
    
    if (!suggestedMetadata) {
      console.log('❌ No suggestion found for "Interest Expense"');
      return;
    }
    
    console.log('\n📋 Smart suggestion for "Interest Expense":');
    console.log('Type:', suggestedMetadata.type);
    console.log('Category:', suggestedMetadata.category);
    console.log('Subcategory:', suggestedMetadata.subcategory);
    console.log('Financial Category:', suggestedMetadata.financialCategory);
    console.log('Financial Subcategory:', suggestedMetadata.financialSubcategory);
    console.log('Explanation:', suggestedMetadata.explanation);
    console.log('Confidence:', suggestedMetadata.confidence);
    
    // Create the account with the suggested metadata
    const accountRepository = AppDataSource.getRepository(Account);
    
    // Find a user to associate with (using the first user found)
    const userRepository = AppDataSource.getRepository('User');
    const users = await userRepository.find();
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    const testUser = users[0];
    console.log(`\n👤 Using user ID: ${testUser.id}`);
    
    const newAccount = accountRepository.create({
      name: 'Interest Expense',
      type: suggestedMetadata.type,
      category: suggestedMetadata.category,
      subcategory: suggestedMetadata.subcategory,
      financialCategory: suggestedMetadata.financialCategory,
      financialSubcategory: suggestedMetadata.financialSubcategory,
      balance: 0,
      isLiquid: false,
      user: { id: testUser.id }
    });
    
    const savedAccount = await accountRepository.save(newAccount);
    
    console.log('\n✅ Created Interest Expense account:');
    console.log('ID:', savedAccount.id);
    console.log('Name:', savedAccount.name);
    console.log('Type:', savedAccount.type);
    console.log('Financial Category:', savedAccount.financialCategory);
    console.log('Financial Subcategory:', savedAccount.financialSubcategory);
    
    // Verify it was created correctly
    const retrievedAccount = await accountRepository.findOne({
      where: { id: savedAccount.id }
    });
    
    if (retrievedAccount) {
      console.log('\n✅ Account retrieved successfully from database');
      console.log('Final categorization:', {
        type: retrievedAccount.type,
        financialCategory: retrievedAccount.financialCategory,
        financialSubcategory: retrievedAccount.financialSubcategory
      });
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

testInterestExpenseCreation(); 