// data-source.ts

import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Account } from "../entities/Account";
import { Transaction } from "../entities/Transaction";
import { RecurringTransaction } from "../entities/RecurringTransaction";
import { SplitTransaction } from "../entities/SplitTransaction";

console.log("Database Host:", process.env.DB_HOST);
console.log("Database Port:", process.env.DB_PORT);
console.log("Database User:", process.env.DB_USER);
console.log("Database Pass:", process.env.DB_PASS);
console.log("Database Name:", process.env.DB_NAME);

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: "postgres",
  password: "trojans3",
  database: process.env.DB_NAME,
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
