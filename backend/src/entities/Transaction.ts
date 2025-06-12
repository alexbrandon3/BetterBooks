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
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column()
  startDate!: Date;

  @Column({
    type: "enum",
    enum: TransactionType,
    default: TransactionType.EXPENSE
  })
  type!: TransactionType;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ type: "enum", enum: RecurrencePattern, nullable: true })
  recurrencePattern?: RecurrencePattern;

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date;

  @ManyToOne(() => User, (user) => user.transactions, { eager: true })
  user!: User;

  @OneToMany(() => JournalEntry, (entry) => entry.transaction, {
    cascade: true,
  })
  entries!: JournalEntry[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  get date(): Date {
    return this.startDate;
  }
}
