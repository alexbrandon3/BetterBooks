import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Transaction } from "./Transaction";
import { Account } from "./Account";
import { User } from "./User";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column()
  type!: "INCOME" | "EXPENSE";

  @ManyToOne(() => Account, (account) => account.transactions)
  account!: Account;

  @ManyToOne(() => User, (user) => user.transactions)
  user!: User;

  @ManyToOne(() => Transaction, (transaction) => transaction.splits)
  transaction!: Transaction;

  @OneToMany(() => SplitTransaction, (split) => split.transaction)
  entries!: SplitTransaction[];
}
