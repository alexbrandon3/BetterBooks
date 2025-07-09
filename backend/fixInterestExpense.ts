import { AppDataSource } from './src/config/data-source';
import { Account, FinancialCategory, AccountType } from './src/entities/Account';

async function fixInterestExpense() {
  try {
    await AppDataSource.initialize();
    
    const accountRepository = AppDataSource.getRepository(Account);
    
    // Find the Interest Expense account
    const interestAccount = await accountRepository.findOne({
      where: { name: 'Interest Expense' }
    });
    
    if (interestAccount) {
      console.log('Found Interest Expense account:', {
        id: interestAccount.id,
        name: interestAccount.name,
        type: interestAccount.type,
        financialCategory: interestAccount.financialCategory,
        financialSubcategory: interestAccount.financialSubcategory
      });
      
      // Update the account to be properly categorized as an expense
      await accountRepository.update(interestAccount.id, {
        type: AccountType.EXPENSE,
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'INTEREST_EXPENSE',
        category: 'Interest',
        subcategory: 'Interest Expenses'
      });
      
      console.log('✅ Updated Interest Expense account to be properly categorized as an expense');
      
      // Verify the update
      const updatedAccount = await accountRepository.findOne({
        where: { id: interestAccount.id }
      });
      
      console.log('Updated account:', {
        id: updatedAccount?.id,
        name: updatedAccount?.name,
        type: updatedAccount?.type,
        financialCategory: updatedAccount?.financialCategory,
        financialSubcategory: updatedAccount?.financialSubcategory
      });
    } else {
      console.log('❌ Interest Expense account not found');
    }
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error:', error);
  }
}

fixInterestExpense(); 