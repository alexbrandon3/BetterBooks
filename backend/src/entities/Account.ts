// Account.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Transaction } from "./Transaction";
import { RecurringTransaction } from "./RecurringTransaction";

export enum AccountType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
  EQUITY = "EQUITY",
  REVENUE = "REVENUE",
  EXPENSE = "EXPENSE"
}

export enum FinancialCategory {
  CURRENT_ASSET = "CURRENT_ASSET",
  FIXED_ASSET = "FIXED_ASSET",
  CURRENT_LIABILITY = "CURRENT_LIABILITY",
  LONG_TERM_LIABILITY = "LONG_TERM_LIABILITY",
  EQUITY = "EQUITY",
  OPERATING_REVENUE = "OPERATING_REVENUE",
  NON_OPERATING_REVENUE = "NON_OPERATING_REVENUE",
  OPERATING_EXPENSE = "OPERATING_EXPENSE",
  NON_OPERATING_EXPENSE = "NON_OPERATING_EXPENSE"
}

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({
    type: "enum",
    enum: AccountType,
  })
  type!: AccountType;

  @Column("numeric", { precision: 12, scale: 2 })
  balance!: number;

  @ManyToOne(() => User, (user) => user.accounts, {
    eager: true,
    onDelete: "CASCADE",
  })
  user!: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];

  @OneToMany(
    () => RecurringTransaction,
    (recurringTransaction) => recurringTransaction.account
  )
  recurringTransactions!: RecurringTransaction[];

  @Column({ default: "Uncategorized" })
  category!: string;

  @Column({ default: "" })
  subcategory!: string;

  @Column({
    type: "enum",
    enum: FinancialCategory,
  })
  financialCategory!: FinancialCategory;

  @Column({ default: "Uncategorized" })
  financialSubcategory!: string;
}
