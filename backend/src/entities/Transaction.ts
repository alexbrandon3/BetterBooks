import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Account } from "./Account";
import { SplitTransaction } from "./SplitTransaction";

export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum CashFlowCategory {
  OPERATING = "OPERATING",
  INVESTING = "INVESTING",
  FINANCING = "FINANCING",
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  description!: string;

  @Column({ type: "enum", enum: TransactionType })
  type!: TransactionType;

  @ManyToOne(() => User, (user) => user.transactions, { eager: true })
  user!: User;

  @ManyToOne(() => Account, (account) => account.transactions, { eager: true })
  account!: Account;

  @Column({ type: "enum", enum: CashFlowCategory, nullable: true })
  cashFlowCategory?: CashFlowCategory;

  @OneToMany(() => SplitTransaction, (split) => split.transaction, {
    cascade: true,
  })
  splits!: SplitTransaction[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
