// src/entities/Entry.ts
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

export type EntrySide = "DEBIT" | "CREDIT";

@Entity()
export class Entry {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("decimal", { precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: "enum", enum: ["DEBIT", "CREDIT"] })
  side!: EntrySide;

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
