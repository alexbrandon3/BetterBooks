// Transaction.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Account } from "./Account";
import { SplitTransaction } from "./SplitTransaction";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  amount!: number;

  @Column()
  description!: string;

  @Column({
    type: "enum",
    enum: ["INCOME", "EXPENSE"],
  })
  type!: "INCOME" | "EXPENSE";

  @ManyToOne(() => Account, (account) => account.transactions, {
    onDelete: "CASCADE",
  })
  account!: Account;

  @OneToMany(
    () => SplitTransaction,
    (splitTransaction) => splitTransaction.transaction
  )
  splitTransactions!: SplitTransaction[];
}
