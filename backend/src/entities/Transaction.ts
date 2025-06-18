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
import { JournalEntry } from "./JournalEntry";
import { TransactionType } from "../types/transaction.types";

export enum RecurrencePattern {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY"
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: TransactionType
  })
  type: TransactionType;

  @Column()
  category: string;

  @Column()
  description: string;

  @Column()
  date: Date;

  @ManyToOne(() => User, user => user.transactions)
  user: User;

  @OneToMany(() => JournalEntry, (entry) => entry.transaction, {
    cascade: true,
  })
  entries!: JournalEntry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
