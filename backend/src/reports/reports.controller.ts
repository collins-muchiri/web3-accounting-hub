import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Same single-tenant stub as TransactionsController until Company ships.
  private readonly DEMO_COMPANY_ID = '00000000-0000-4000-8000-000000000001';

  @Get('profit-and-loss')
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  profitAndLoss(@CurrentUser() _user: AuthenticatedUser) {
    return this.reportsService.profitAndLoss(this.DEMO_COMPANY_ID);
  }
}
