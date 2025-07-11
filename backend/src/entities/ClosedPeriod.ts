import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

export interface ClosedPeriodMetadata {
  closedBy: string;
  totalEntries: number;
  netIncome: number;
  revenueAccounts: number;
  expenseAccounts: number;
}

@Entity("closed_periods")
export class ClosedPeriod {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: number;

  @Column({ type: "date" })
  startDate: Date;

  @Column({ type: "date" })
  endDate: Date;

  @Column({ type: "varchar", length: 20 })
  periodType: "monthly" | "quarterly" | "yearly";

  @Column({ type: "uuid", nullable: true })
  closingTransactionId: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: ClosedPeriodMetadata;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;
} 