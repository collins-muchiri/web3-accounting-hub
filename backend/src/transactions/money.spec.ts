import {
  assertSafeAmount,
  signedCents,
} from './transactions.service';
import { TransactionType } from './entities/transaction.entity';

/**
 * Pure-logic tests for the money layer. These guard the accounting-correct
 * invariants called out in the audit: integer cents only, explicit overflow
 * rejection, and sign conventions (INCOME positive, EXPENSE negative).
 */
describe('money helpers', () => {
  describe('assertSafeAmount', () => {
    it('accepts integers within the safe range', () => {
      expect(() => assertSafeAmount(0)).not.toThrow();
      expect(() => assertSafeAmount(1999_99)).not.toThrow();
      expect(() => assertSafeAmount(-5)).not.toThrow();
    });

    it('rejects non-integers (floats must never touch money)', () => {
      expect(() => assertSafeAmount(10.5)).toThrow(RangeError);
      expect(() => assertSafeAmount(NaN)).toThrow(RangeError);
    });

    it('rejects values beyond Number.MAX_SAFE_INTEGER', () => {
      expect(() => assertSafeAmount(Number.MAX_SAFE_INTEGER + 2)).toThrow(RangeError);
      expect(() => assertSafeAmount(-Number.MAX_SAFE_INTEGER - 2)).toThrow(RangeError);
    });
  });

  describe('signedCents', () => {
    it('treats INCOME as positive', () => {
      expect(signedCents({ type: TransactionType.INCOME, amountCents: '2500' })).toBe(2500);
    });
    it('treats EXPENSE as negative', () => {
      expect(signedCents({ type: TransactionType.EXPENSE, amountCents: '2500' })).toBe(-2500);
    });
    it('rejects unsafe stored magnitudes instead of silently wrapping', () => {
      expect(() =>
        signedCents({ type: TransactionType.EXPENSE, amountCents: '9007199254740993' }),
      ).toThrow(RangeError);
    });
  });
});
