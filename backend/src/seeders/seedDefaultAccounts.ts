import { AppDataSource } from "../config/data-source";
import { Account, FinancialCategory, AccountType } from "../entities/Account";
import { User } from "../entities/User";

export const seedDefaultAccounts = async () => {
  // Initialize the data source
  await AppDataSource.initialize();

  const accountRepo = AppDataSource.getRepository(Account);
  const userRepo = AppDataSource.getRepository(User);

  const user = await userRepo.findOne({ where: { email: "example@example.com" } });
  if (!user) {
    console.error("No user found to assign default accounts to.");
    return;
  }

  const defaults = [
    {
      name: "Business Checking",
      type: AccountType.ASSET,
      category: "Bank",
      subcategory: "Checking",
      financialCategory: FinancialCategory.CURRENT_ASSET,
      financialSubcategory: "CASH_AND_CASH_EQUIVALENTS",
      balance: 10000,
    },
    {
      name: "Office Supplies",
      type: AccountType.EXPENSE,
      category: "Administrative",
      subcategory: "Office",
      financialCategory: FinancialCategory.OPERATING_EXPENSE,
      financialSubcategory: "GENERAL_ADMINISTRATIVE",
      balance: 0,
    },
    {
      name: "Product Sales",
      type: AccountType.REVENUE,
      category: "Sales",
      subcategory: "Retail",
      financialCategory: FinancialCategory.OPERATING_REVENUE,
      financialSubcategory: "PRODUCT_REVENUE",
      balance: 0,
    },
  ];

  for (const data of defaults) {
    const exists = await accountRepo.findOne({
      where: { name: data.name, user: { id: user.id } },
    });

    if (!exists) {
      const account = accountRepo.create({ ...data, user });
      await accountRepo.save(account);
      console.log(`Seeded account: ${data.name}`);
    }
  }

  console.log("✅ Default accounts seeded.");
  await AppDataSource.destroy();
};

seedDefaultAccounts().then(() => process.exit());
