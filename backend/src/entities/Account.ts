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

@Entity()
export class Account {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column()
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
}
