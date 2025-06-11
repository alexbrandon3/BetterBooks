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

  @Column({ type: "timestamp", nullable: true })
  endDate?: Date;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => Account, { eager: true })
  account!: Account;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 