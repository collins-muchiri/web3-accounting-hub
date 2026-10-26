import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Fail-closed RBAC guard: if a route declares no @Roles(), any
 * authenticated user passes (JwtAuthGuard already ran). If @Roles() IS
 * declared, the JWT's role claim must be in the list. The role always
 * comes from the signed token payload — never from the request body or
 * query string.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) return false;
    return required.includes(user.role);
  }
}
