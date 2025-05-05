// src/entities/SplitTransaction.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Transaction } from "./Transaction";
import { Account } from "./Account";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  amount!: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries, {
    onDelete: "CASCADE",
  })
  transaction!: Transaction;

  @ManyToOne(() => Account, { eager: true })
  account!: Account;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
