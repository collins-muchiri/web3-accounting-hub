import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity('transactions')
@Index(['companyId', 'occurredAt'])
@Index(['createdById'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Multi-tenant key. Every query MUST filter on it (see service). */
  @Column({ type: 'uuid' })
  companyId: string;

  /**
   * MONEY AS INTEGER MINOR UNITS (cents). Never a float and never a JS
   * Number-based decimal — arithmetic happens in bigint-safe paths and is
   * validated against MAX_SAFE_INTEGER at the boundary.
   */
  @Column({ type: 'bigint' })
  amountCents: string; // TypeORM maps bigint to string to avoid precision loss

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'varchar', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'varchar', length: 500 })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  /** When the transaction economically occurred (business time). */
  @Column({ type: 'timestamptz' })
  occurredAt: Date;

  /** Immutable once set: who created the journal entry (audit trail). */
  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  createdById: string;

  /** Append-only discipline: rows are corrected by reversal entries, not
   *  updates. `reversesId` links a correcting entry to the original. */
  @Column({ type: 'uuid', nullable: true })
  reversesId: string | null;

  @Column({ type: 'boolean', default: false })
  reversed: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
