import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';

export enum GoalType {
  INCREASE_ASSETS = 'INCREASE_ASSETS',
  DECREASE_LIABILITIES = 'DECREASE_LIABILITIES'
}

@Entity()
export class FinancialGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: GoalType
  })
  type: GoalType;

  @Column('decimal', { precision: 10, scale: 2 })
  targetAmount: number;

  @Column()
  targetDate: Date;

  @Column('decimal', { precision: 5, scale: 2, default: 0 })
  progress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.goals)
  user: User;
} 