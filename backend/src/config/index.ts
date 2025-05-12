import dotenv from "dotenv";
import path from "path";

// Force-load the .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Log to verify .env variables are loading
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

export const JWT_SECRET = process.env.JWT_SECRET;
export const DB_HOST = process.env.DB_HOST;
export const DB_PORT = Number(process.env.DB_PORT);
export const DB_USER = process.env.DB_USER;
export const DB_PASS = process.env.DB_PASS;
export const DB_NAME = process.env.DB_NAME;
