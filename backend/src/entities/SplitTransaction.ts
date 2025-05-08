import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Account } from "./Account";
import { Transaction } from "./Transaction";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  amount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Account, (account) => account.splitTransactions, {
    nullable: false,
  })
  account!: Account;

  @ManyToOne(() => Transaction, (transaction) => transaction.splits, {
    nullable: false,
  })
  transaction!: Transaction;
}
