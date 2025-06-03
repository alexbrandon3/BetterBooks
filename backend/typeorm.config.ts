import { DataSource } from "typeorm";
import { User } from "./src/entities/User";
import { Account } from "./src/entities/Account";
import { Transaction } from "./src/entities/Transaction";
import { SplitTransaction } from "./src/entities/SplitTransaction";
import { RecurringTransaction } from "./src/entities/RecurringTransaction";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "password",
  database: process.env.DB_NAME || "betterbooks",
  synchronize: false,
  logging: true,
  entities: [User, Account, Transaction, SplitTransaction, RecurringTransaction],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
}); 