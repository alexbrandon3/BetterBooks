import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Account } from "./Account";
import { RecurrencePattern } from "./Transaction";

@Entity()
export class RecurringTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column("decimal", { precision: 10, scale: 2 })
  amount!: number;

  @Column({
    type: "enum",
    enum: RecurrencePattern,
  })
  recurrencePattern!: RecurrencePattern;

  @Column()
  nextRun!: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date;

  @Column({ type: "timestamp", nullable: true })
  lastExecuted?: Date;

  @Column({ nullable: true })
  lastExecutionResult?: string; // "SUCCESS" | "FAILED" | "SKIPPED"

  @ManyToOne(() => User, { eager: true })
  user!: User;

  // Primary account (the one the user selected as main)
  @ManyToOne(() => Account, { eager: true })
  primaryAccount!: Account;

  // Secondary account (the other side of the transaction)
  @ManyToOne(() => Account, { eager: true })
  secondaryAccount!: Account;

  // Entry types for each account
  @Column()
  primaryEntryType!: string; // "DEBIT" or "CREDIT"

  @Column()
  secondaryEntryType!: string; // "DEBIT" or "CREDIT"

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 