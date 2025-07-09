import { AppDataSource } from './src/config/data-source';
import { Account } from './src/entities/Account';

async function listAllAccounts() {
  try {
    await AppDataSource.initialize();
    
    const accountRepository = AppDataSource.getRepository(Account);
    const accounts = await accountRepository.find({
      order: { name: 'ASC' }
    });
    
    console.log('📋 All Accounts:');
    console.log('ID | Name | Type | Financial Category | Financial Subcategory');
    console.log('---|------|------|-------------------|----------------------');
    
    accounts.forEach(account => {
      console.log(`${account.id.toString().padStart(2)} | ${account.name.padEnd(20)} | ${account.type.padEnd(8)} | ${account.financialCategory.padEnd(18)} | ${account.financialSubcategory}`);
    });
    
    // Check for any interest-related accounts
    const interestAccounts = accounts.filter(acc => 
      acc.name.toLowerCase().includes('interest') || 
      acc.financialSubcategory.toLowerCase().includes('interest')
    );
    
    if (interestAccounts.length > 0) {
      console.log('\n🎯 Interest-related accounts found:');
      interestAccounts.forEach(account => {
        console.log(`- ${account.name} (ID: ${account.id}, Type: ${account.type}, Category: ${account.financialCategory})`);
      });
    } else {
      console.log('\n❌ No interest-related accounts found');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

listAllAccounts(); 