import { RolesGuard } from './roles.guard';
import { Role } from '../../common/enums/role.enum';
import { Reflector } from '@nestjs/core';

/** Minimal ExecutionContext doubles — no HTTP server needed. */
function makeContext(user: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as never;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();

  it('allows any authenticated user when route declares no roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext({ role: Role.VIEWER }))).toBe(true);
  });

  it('denies unauthenticated requests even without role metadata (fail closed)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext(undefined))).toBe(false);
  });

  it('enforces the declared role from the JWT payload', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(makeContext({ role: Role.ACCOUNTANT }))).toBe(false);
    expect(guard.canActivate(makeContext({ role: Role.ADMIN }))).toBe(true);
  });

  it('ignores client-supplied role-like fields (only request.user is read)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const guard = new RolesGuard(reflector);
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.VIEWER }, role: Role.ADMIN }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as never;
    expect(guard.canActivate(ctx)).toBe(false);
  });
});
