const { AppDataSource } = require('./src/config/data-source');

async function checkInterestAccount() {
  try {
    await AppDataSource.initialize();
    
    const accountRepository = AppDataSource.getRepository('Account');
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