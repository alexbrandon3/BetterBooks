import { AppDataSource } from './src/config/data-source';
import { Account } from './src/entities/Account';

async function searchExpenseAccounts() {
  try {
    await AppDataSource.initialize();
    
    const accountRepository = AppDataSource.getRepository(Account);
    
    // Search for accounts with "expense" in the name (case insensitive)
    const expenseAccounts = await accountRepository.find({
      where: [
        { name: 'Interest Expense' },
        { name: 'interest expense' },
        { name: 'Interest expense' },
        { name: 'interest Expense' }
      ]
    });
    
    console.log('🔍 Exact matches for "Interest Expense":');
    if (expenseAccounts.length > 0) {
      expenseAccounts.forEach(account => {
        console.log(`- ${account.name} (ID: ${account.id}, Type: ${account.type}, Category: ${account.financialCategory})`);
      });
    } else {
      console.log('❌ No exact matches found');
    }
    
    // Search for any account with "expense" in the name
    const allAccounts = await accountRepository.find();
    const accountsWithExpense = allAccounts.filter(acc => 
      acc.name.toLowerCase().includes('expense')
    );
    
    console.log('\n🔍 All accounts with "expense" in the name:');
    if (accountsWithExpense.length > 0) {
      accountsWithExpense.forEach(account => {
        console.log(`- ${account.name} (ID: ${account.id}, Type: ${account.type}, Category: ${account.financialCategory})`);
      });
    } else {
      console.log('❌ No accounts with "expense" in the name found');
    }
    
    // Check for accounts with "interest" in the name
    const accountsWithInterest = allAccounts.filter(acc => 
      acc.name.toLowerCase().includes('interest')
    );
    
    console.log('\n🔍 All accounts with "interest" in the name:');
    if (accountsWithInterest.length > 0) {
      accountsWithInterest.forEach(account => {
        console.log(`- ${account.name} (ID: ${account.id}, Type: ${account.type}, Category: ${account.financialCategory})`);
      });
    } else {
      console.log('❌ No accounts with "interest" in the name found');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

searchExpenseAccounts(); 