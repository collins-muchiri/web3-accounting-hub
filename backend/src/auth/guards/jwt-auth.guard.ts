import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Global-ish auth guard applied per-controller (not globally) so that
 * intentionally public routes (/health, /auth/login) stay reachable.
 * Any NEW controller must be reviewed for whether it needs this guard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
