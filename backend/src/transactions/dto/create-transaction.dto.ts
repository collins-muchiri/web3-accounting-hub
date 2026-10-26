import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsPositive,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

/**
 * Input validation for journal entries. Amounts arrive as INTEGER minor
 * units (cents) only — a decimal point in the payload is rejected outright
 * so float parsing can never touch money. The service additionally bounds
 * the value against Number.MAX_SAFE_INTEGER before arithmetic.
 */
export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsInt({ message: 'amountCents must be an integer (minor units, no decimals)' })
  @Min(1, { message: 'amountCents must be positive' })
  @IsPositive()
  amountCents: number;

  // ISO-4217 alpha-3, uppercased (e.g. USD, EUR). Validated against a
  // supported-currency list in the service (single source of truth).
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO-4217 alpha-3 code' })
  currency: string;

  @IsString()
  @MaxLength(500)
  description: string;

  @IsString()
  @Length(1, 100)
  category: string;

  @IsISO8601({ strict: true }, { message: 'occurredAt must be ISO-8601' })
  @Type(() => Date)
  occurredAt: string;
}
