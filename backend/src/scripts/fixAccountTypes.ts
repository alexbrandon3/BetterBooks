import { AppDataSource } from "../config/data-source";

export const fixAccountTypes = async () => {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    
    console.log("🔧 Fixing account types from INCOME to REVENUE...");
    
    // Update existing accounts with INCOME type to REVENUE
    const result = await AppDataSource.query(`
      UPDATE account 
      SET "type" = 'REVENUE' 
      WHERE "type" = 'INCOME'
    `);
    
    console.log(`✅ Updated ${result.rowCount || 0} accounts from INCOME to REVENUE`);
    
    // Also update any financial categories that might be missing
    console.log("🔧 Adding missing financial categories to enum...");
    
    try {
      await AppDataSource.query(`
        ALTER TYPE "public"."account_financialcategory_enum" 
        ADD VALUE IF NOT EXISTS 'RETAINED_EARNINGS'
      `);
      console.log("✅ Added RETAINED_EARNINGS to enum");
    } catch (error) {
      console.log("ℹ️  RETAINED_EARNINGS already exists in enum");
    }
    
    try {
      await AppDataSource.query(`
        ALTER TYPE "public"."account_financialcategory_enum" 
        ADD VALUE IF NOT EXISTS 'DRAWINGS'
      `);
      console.log("✅ Added DRAWINGS to enum");
    } catch (error) {
      console.log("ℹ️  DRAWINGS already exists in enum");
    }
    
    console.log("✅ Account types and enums fixed successfully!");
    
  } catch (error) {
    console.error("❌ Error fixing account types:", error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixAccountTypes()
    .then(() => {
      console.log("🎉 Account type fix completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Account type fix failed:", error);
      process.exit(1);
    });
} 