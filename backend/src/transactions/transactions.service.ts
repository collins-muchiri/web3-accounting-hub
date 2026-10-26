import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';

/** ISO-4217 codes this deployment supports (single source of truth). */
export const SUPPORTED_CURRENCIES = new Set(['USD', 'EUR', 'GBP', 'KES', 'NGN']);

/**
 * Money helpers. All amounts are integer minor units (cents) held in JS
 * numbers bounded by MAX_SAFE_INTEGER; anything larger must be migrated to
 * BigInt columns before use. Guards here make silent overflow impossible.
 */
export const MAX_MONEY = Number.MAX_SAFE_INTEGER;

export function assertSafeAmount(amountCents: number): void {
  if (!Number.isInteger(amountCents) || Math.abs(amountCents) > MAX_MONEY) {
    throw new RangeError(
      'amountCents exceeds the safe integer range for money arithmetic',
    );
  }
}

/** Signed contribution of a transaction to the cash balance. */
export function signedCents(t: Pick<Transaction, 'type' | 'amountCents'>): number {
  const cents = Number(t.amountCents);
  assertSafeAmount(cents);
  return t.type === TransactionType.INCOME ? cents : -cents;
}

export interface BalanceSummary {
  /** Sums per currency, in integer minor units. */
  byCurrency: Record<string, number>;
  count: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly txRepo: Repository<Transaction>,
  ) {}

  async create(
    companyId: string,
    createdById: string,
    dto: {
      type: TransactionType;
      amountCents: number;
      currency: string;
      description: string;
      category: string;
      occurredAt: string;
    },
  ): Promise<Transaction> {
    assertSafeAmount(dto.amountCents);
    if (!SUPPORTED_CURRENCIES.has(dto.currency)) {
      // BadRequestException: this is invalid client input, not a missing
      // resource (NotFoundException would be misleading).
      throw new BadRequestException(
        `Unsupported currency: ${dto.currency}. Supported: ${[...SUPPORTED_CURRENCIES].join(', ')}`,
      );
    }
    const tx = this.txRepo.create({
      companyId,
      createdById,
      type: dto.type,
      amountCents: String(dto.amountCents),
      currency: dto.currency,
      description: dto.description,
      category: dto.category,
      occurredAt: new Date(dto.occurredAt),
    });
    return this.txRepo.save(tx);
  }

  /**
   * TENANT ISOLATION: companyId is mandatory on every query path — there is
   * no method here that can list or fetch transactions across tenants.
   */
  async list(
    companyId: string,
    opts: { page: number; pageSize: number; currency?: string },
  ): Promise<{ items: Transaction[]; total: number }> {
    const where: FindOptionsWhere<Transaction> = { companyId };
    if (opts.currency) where.currency = opts.currency;
    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { occurredAt: 'DESC' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    });
    return { items, total };
  }

  async findOneForCompany(
    companyId: string,
    id: string,
  ): Promise<Transaction> {
    const tx = await this.txRepo.findOne({ where: { id, companyId } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  /**
   * Append-only correction: instead of UPDATE/DELETE we insert a reversal
   * entry with the same magnitude and opposite sign, then flag the original
   * as reversed inside ONE transaction (all-or-nothing) so the ledger can
   * never end up half-corrected.
   */
  async reverse(
    companyId: string,
    createdById: string,
    id: string,
  ): Promise<Transaction> {
    return this.txRepo.manager.transaction(async (em) => {
      const original = await em.findOne(Transaction, {
        where: { id, companyId },
      });
      if (!original) throw new NotFoundException('Transaction not found');
      if (original.reversed) {
        throw new NotFoundException('Transaction already reversed');
      }
      const oppositeType =
        original.type === TransactionType.INCOME
          ? TransactionType.EXPENSE
          : TransactionType.INCOME;

      const reversal = em.create(Transaction, {
        companyId,
        createdById,
        type: oppositeType,
        amountCents: original.amountCents,
        currency: original.currency,
        description: `Reversal of ${id}`,
        category: original.category,
        occurredAt: new Date(),
        reversesId: original.id,
      });
      const saved = await em.save(reversal);

      original.reversed = true;
      await em.save(original);
      return saved;
    });
  }

  /** Balance summary used by reports; pure integer addition, guarded. */
  async balances(companyId: string): Promise<BalanceSummary> {
    const rows = await this.txRepo.find({
      where: { companyId },
      select: ['type', 'amountCents', 'currency'],
    });
    const byCurrency: Record<string, number> = {};
    for (const row of rows) {
      const current = byCurrency[row.currency] ?? 0;
      const delta = signedCents(row);
      const next = current + delta;
      // Detect accumulation overflow even though each part is safe.
      assertSafeAmount(next);
      byCurrency[row.currency] = next;
    }
    return { byCurrency, count: rows.length };
  }
}
