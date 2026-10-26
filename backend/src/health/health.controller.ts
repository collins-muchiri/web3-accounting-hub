import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  // Liveness probe only. A readiness check that pings the database should
  // be added once real modules (auth/transactions) exist. Never expose
  // configuration values or secrets from this endpoint.
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
