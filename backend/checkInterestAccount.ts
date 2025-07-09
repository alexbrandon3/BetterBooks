import { AppDataSource } from './src/config/data-source';
import { Account } from './src/entities/Account';

async function checkInterestAccount() {
  try {
    await AppDataSource.initialize();
    
    const accountRepository = AppDataSource.getRepository(Account);
    const accounts = await accountRepository.find({
      where: [
        { name: 'Interest Expense' },
        { financialSubcategory: 'INTEREST_EXPENSE' }
      ]
    });
    
    console.log('Found accounts:', accounts);
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInterestAccount(); 