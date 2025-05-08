import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { Account } from "./Account";
import { RecurringTransaction } from "./RecurringTransaction";
import { SplitTransaction } from "./SplitTransaction";
import { User } from "./User";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  description!: string;

  @Column({ type: "decimal", precision: 15, scale: 2, default: 0 })
  amount!: number;

  @Column()
  type!: string;

  @Column()
  date!: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isRecurring!: boolean;

  @Column({ nullable: true })
  recurrenceRule!: string;

  @Column({ nullable: true })
  recurrence!: string;

  @Column({ nullable: true })
  interval!: number;

  @Column({ nullable: true })
  recurrencePattern!: string;

  @Column({ nullable: true })
  nextOccurrence!: Date;

  @Column({ nullable: true })
  reference!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Account, (account) => account.transactions, {
    nullable: true,
  })
  account!: Account;

  @OneToOne(
    () => RecurringTransaction,
    (recurringTransaction) => recurringTransaction.transaction,
    {
      cascade: true,
      nullable: true,
    }
  )
  @JoinColumn()
  recurringTransaction!: RecurringTransaction;

  @OneToMany(() => SplitTransaction, (split) => split.transaction, {
    cascade: true,
  })
  splits!: SplitTransaction[];

  @ManyToOne(() => User, (user) => user.transactions)
  user!: User;
}
