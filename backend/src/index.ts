import { errorHandler } from "./utils/errors";
import app from "./app";  // Import the configured app
import dotenv from "dotenv";
import path from "path";
import { AppDataSource } from "./config/data-source";

// Force-load the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Environment variables check
console.log("📝 Environment Variables Check:");
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);

if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in .env file");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;

// Initialize Database Connection
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connection established successfully.");
    
    // Start the server only after database connection is established
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  });

// Global error handler (must be last)
app.use(errorHandler);
