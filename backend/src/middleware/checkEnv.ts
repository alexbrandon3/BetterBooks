// src/middleware/checkEnv.ts
import dotenv from "dotenv";
dotenv.config();

const requiredEnv = ["JWT_SECRET", "DB_URL", "PORT"];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});
