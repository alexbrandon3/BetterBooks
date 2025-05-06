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
import { User } from "./User";

@Entity()
export class SplitTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("decimal", { precision: 10, scale: 2 }) // ✅ was likely just "int" or "integer"
  amount!: number;

  @ManyToOne(() => Transaction, (transaction) => transaction.entries, {
    onDelete: "CASCADE",
  })
  transaction!: Transaction;

  @ManyToOne(() => Account, { eager: true })
  account!: Account;

  @ManyToOne(() => User)
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
