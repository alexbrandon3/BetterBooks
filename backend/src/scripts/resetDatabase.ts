import { AppDataSource } from "../config/data-source";

async function resetDatabase() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("✅ Database connection established");

    // Drop all tables
    await AppDataSource.query(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    console.log("✅ Database schema dropped");

    // Synchronize the schema
    await AppDataSource.synchronize();
    console.log("✅ Database schema synchronized");

    // Close the connection
    await AppDataSource.destroy();
    console.log("✅ Database connection closed");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  }
}

resetDatabase(); 