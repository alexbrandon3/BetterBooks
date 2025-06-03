// src/config/data-source.ts

import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "trojans3",
  database: process.env.DB_NAME || "betterbooks",
  synchronize: false,
  logging: true,
  entities: [
    User,
    Account,
    Transaction,
    RecurringTransaction,
    SplitTransaction
  ],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
});
