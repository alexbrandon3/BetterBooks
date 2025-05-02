import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { User } from './User';
import { Transaction } from './Transaction';
import { RecurringTransaction } from './RecurringTransaction';

@Unique(['number', 'user']) // 👈 enforce uniqueness per user
@Entity()
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  number!: string; // 👈 removed unique: true

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  type!: string;

  @Column()
  subtype!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  user!: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions!: Transaction[];

  @OneToMany(() => RecurringTransaction, (recurring) => recurring.account)
  recurringTransactions!: RecurringTransaction[];
}
