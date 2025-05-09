// data-source.ts
import dotenv from "dotenv";
dotenv.config(); // 👈 This forces .env to load before DataSource initializes

import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";

console.log("🔍 Database Configuration:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: String(process.env.DB_USER).trim(), // 👈 Force string conversion and trim
  password: String(process.env.DB_PASS).trim(),
  database: String(process.env.DB_NAME).trim(),
  synchronize: true,
  logging: false,
  entities: [
    User,
    Account,
    Transaction,
    RecurringTransaction,
    SplitTransaction,
  ],
  migrations: [],
  subscribers: [],
});
