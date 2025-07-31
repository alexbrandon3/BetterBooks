import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity()
@Index(["userId", "description"], { unique: false })
@Index(["userId", "suggestedAccountId"])
@Index(["feedbackType", "createdAt"])
export class SuggestionFeedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column({ type: 'text' })
  description: string; // Normalized description

  @Column()
  suggestedAccountId: number;

  @Column()
  suggestedAccountName: string;

  @Column()
  confidence: number; // Original confidence score (0-100)

  @Column({
    type: 'enum',
    enum: ['ACCEPTED', 'REJECTED', 'IGNORED'],
    default: 'IGNORED'
  })
  feedbackType: 'ACCEPTED' | 'REJECTED' | 'IGNORED';

  @Column({ nullable: true })
  selectedAccountId: number; // What user actually selected (if different from suggested)

  @Column({ nullable: true })
  selectedAccountName: string;

  @Column({ type: 'text', nullable: true }) userReason: string;
  @Column({ type: 'text', nullable: true }) rejectionReason: string;
  @Column({ type: 'jsonb', nullable: true }) suggestionMetadata: {
    accountType: string;
    category: string;
    financialCategory: string;
    suggestedEntryType: 'DEBIT' | 'CREDIT';
    toneMessage?: string;
    detailedReason: string;
    businessKeywords?: {
      category: string;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
      keywords: string[];
      businessContext: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  contextData: {
    userAgent?: string;
    timestamp: string;
    sessionId?: string;
    suggestionSource: 'SMART_AGENT' | 'USER_PREFERENCE' | 'KEYWORD_FALLBACK';
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 