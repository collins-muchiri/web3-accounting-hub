import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Fail fast on missing/weak configuration instead of silently using
      // hardcoded placeholder credentials.
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: Number(configService.get('DATABASE_PORT') ?? 5432),
        username: configService.getOrThrow<string>('POSTGRES_USER'),
        password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
        database: configService.getOrThrow<string>('POSTGRES_DB'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // SECURITY / DATA-INTEGRITY: synchronize is permanently disabled.
        // Schema changes for financial data go through reviewed TypeORM
        // migrations only (see docs/deployment/database-migrations.md).
        synchronize: false,
        migrationsRun: false,
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    UsersModule,
    AuthModule,
    TransactionsModule,
    ReportsModule,
    // NOTE: Web3Module and IpfsModule were referenced in the original
    // scaffold but never existed. They stay OUT until implemented with
    // tests — do not advertise features that are not present.
  ],
})
export class AppModule {}