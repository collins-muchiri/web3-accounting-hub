import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

/**
 * RBAC matrix:
 *  - VIEWER  : read-only (list, detail, balances)
 *  - ACCOUNTANT+ADMIN : create entries and post reversals
 * Writes never accept a companyId from the client; it is derived from the
 * authenticated principal's company claim (stubbed to a fixed demo tenant
 * until Companies entities exist — see TODO below).
 */
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // TODO(multi-tenancy): replace with user.companyId once Company entity
  // ships. Hardcoded single-tenant value keeps the wiring honest meanwhile.
  private readonly DEMO_COMPANY_ID = '00000000-0000-4000-8000-000000000001';

  private resolveCompanyId(user: AuthenticatedUser): string {
    void user;
    return this.DEMO_COMPANY_ID;
  }

  @Get()
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(50), ParseIntPipe) pageSize: number,
    @Query('currency') currency?: string,
  ) {
    const clampedSize = Math.min(Math.max(pageSize, 1), 200);
    const clampedPage = Math.max(page, 1);
    return this.transactionsService.list(
      this.resolveCompanyId(user),
      { page: clampedPage, pageSize: clampedSize, currency },
    );
  }

  @Get('balances')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER)
  balances(@CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.balances(this.resolveCompanyId(user));
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.ACCOUNTANT, Role.VIEWER)
  one(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.findOneForCompany(
      this.resolveCompanyId(user),
      id,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.transactionsService.create(
      this.resolveCompanyId(user),
      user.id,
      dto,
    );
  }

  @Post(':id/reverse')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  reverse(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.transactionsService.reverse(
      this.resolveCompanyId(user),
      user.id,
      id,
    );
  }
}
