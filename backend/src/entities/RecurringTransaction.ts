// RecurringTransaction.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Account } from "./Account";

@Entity()
export class RecurringTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  amount!: number;

  @Column()
  description!: string;

  @Column()
  recurrencePattern!: string;

  @ManyToOne(() => Account, (account) => account.recurringTransactions, {
    onDelete: "CASCADE",
  })
  account!: Account;
}
