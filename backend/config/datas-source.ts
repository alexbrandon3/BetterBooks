// data-source.ts

import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Account } from "./entities/Account";
import { Transaction } from "./entities/Transaction";
import { RecurringTransaction } from "./entities/RecurringTransaction";
import { SplitTransaction } from "./entities/SplitTransaction";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
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
