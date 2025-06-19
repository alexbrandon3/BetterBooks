import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { Account, AccountType, FinancialCategory } from "../entities/Account";

async function addFoodAccounts() {
  try {
    console.log('🍽️ Adding food and dining accounts...');
    await AppDataSource.initialize();

    // Get demo user
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { email: 'demo@demo.com' } });
    
    if (!user) {
      console.log('❌ Demo user not found. Please run seedDashboard first.');
      return;
    }

    // Create food and dining related accounts
    const accountRepo = AppDataSource.getRepository(Account);
    const foodAccounts = await accountRepo.save([
      {
        name: 'Food & Dining',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Food',
        subcategory: 'Dining',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'FOOD_DINING'
      },
      {
        name: 'Groceries',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Food',
        subcategory: 'Groceries',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'GROCERIES'
      },
      {
        name: 'Restaurants',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Dining',
        subcategory: 'Restaurants',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'RESTAURANTS'
      },
      {
        name: 'Coffee & Snacks',
        type: AccountType.EXPENSE,
        balance: 0,
        user,
        category: 'Food',
        subcategory: 'Snacks',
        financialCategory: FinancialCategory.OPERATING_EXPENSE,
        financialSubcategory: 'COFFEE_SNACKS'
      }
    ]);

    console.log('✅ Added food accounts:', foodAccounts.map(a => a.name));
    console.log('\n🍽️ Food accounts are now available for smart suggestions!');
    console.log('Try typing "restaurant", "coffee", "groceries", or "food" in transaction descriptions.');
    
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to add food accounts:', error);
    process.exit(1);
  }
}

addFoodAccounts(); 