import { Injectable } from '@nestjs/common';
import { TransactionsService, BalanceSummary } from '../transactions/transactions.service';

export interface ProfitAndLossReport {
  generatedAt: string; // ISO-8601
  /** Net per currency in integer minor units (INCOME - EXPENSE). */
  netByCurrency: Record<string, number>;
  transactionCount: number;
}

/**
 * Reports are computed on demand from the ledger — no duplicated/stale
 * aggregates. All arithmetic stays in guarded integer cents (see
 * transactions.service), so rounding drift is structurally impossible.
 */
@Injectable()
export class ReportsService {
  constructor(private readonly transactionsService: TransactionsService) {}

  async profitAndLoss(companyId: string): Promise<ProfitAndLossReport> {
    const balances: BalanceSummary =
      await this.transactionsService.balances(companyId);
    return {
      generatedAt: new Date().toISOString(),
      netByCurrency: balances.byCurrency,
      transactionCount: balances.count,
    };
  }
}
