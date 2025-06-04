// User.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Transaction } from "./Transaction";
import { Account } from "./Account";
import { RecurringTransaction } from "./RecurringTransaction";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  password!: string;

  @OneToMany(() => Account, (account) => account.user)
  accounts!: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions!: Transaction[];

  @OneToMany(() => RecurringTransaction, (recurring) => recurring.user)
  recurringTransactions!: RecurringTransaction[];
}
