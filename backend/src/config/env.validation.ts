import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV: 'development' | 'test' | 'production' = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 4000;

  // Database — no insecure fallback credentials: values must be provided.
  @IsString()
  DATABASE_HOST!: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  DATABASE_PORT: number = 5432;

  @IsString()
  POSTGRES_USER!: string;

  @IsString()
  POSTGRES_PASSWORD!: string;

  @IsString()
  POSTGRES_DB!: string;

  // Required in every environment; the app refuses to boot without it.
  @IsString()
  @MinLength(32, {
    message:
      'JWT_SECRET must be set and at least 32 characters (generate with: openssl rand -hex 32)',
  })
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  ALLOWED_ORIGINS?: string;

  @IsString()
  @IsOptional()
  IPFS_HOST?: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  IPFS_PORT: number = 5001;
}

/**
 * Validates configuration against the schema above and fails fast when
 * anything is missing or weak. Replaces the previous pattern of hardcoded
 * placeholder credentials ('postgres'/'your_jwt_secret_key').
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map(
        (e) =>
          `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('\n');
    // Note: never log values here, only property names, to avoid leaking secrets.
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return validated;
}
