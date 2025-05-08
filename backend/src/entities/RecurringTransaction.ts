import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Transaction } from "./Transaction";
import { User } from "./User";

@Entity()
export class RecurringTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  description!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  amount!: number;

  @Column()
  type!: string;

  @Column({ nullable: true })
  reference!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column()
  recurrence!: string;

  @Column()
  startDate!: Date;

  @Column({ nullable: true })
  endDate!: Date;

  @Column()
  frequency!: string;

  @Column()
  interval!: number;

  @Column()
  nextRun!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.recurringTransactions)
  user!: User;

  @OneToOne(
    () => Transaction,
    (transaction) => transaction.recurringTransaction,
    {
      cascade: true,
    }
  )
  @JoinColumn()
  transaction!: Transaction;
}
