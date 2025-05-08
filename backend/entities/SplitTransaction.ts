// SplitTransaction.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Transaction } from "./Transaction";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  amount!: number;

  @Column()
  description!: string;

  @ManyToOne(
    () => Transaction,
    (transaction) => transaction.splitTransactions,
    { onDelete: "CASCADE" }
  )
  transaction!: Transaction;
}
