import "dotenv/config";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./src/entities/User";
import { Account } from "./src/entities/Account";
import { Transaction } from "./src/entities/Transaction";
import { RecurringTransaction } from "./src/entities/RecurringTransaction";
import { SplitTransaction } from "./src/entities/SplitTransaction";

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: true,
  entities: [
    User,
    Account,
    Transaction,
    RecurringTransaction,
    SplitTransaction,
  ],
  migrations: ["dist/migrations/*.js"],
});

export default AppDataSource;
