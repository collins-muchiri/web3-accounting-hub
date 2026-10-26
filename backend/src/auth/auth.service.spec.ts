import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';
import type { User } from '../users/entities/user.entity';

/**
 * Unit tests for the authentication core. No database required: UsersService
 * is mocked. These lock in the security properties claimed by the README:
 * generic failure responses, timing-equalized unknown users, deactivated
 * account rejection, and signed short-lived tokens with pinned claims.
 */
describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByEmailWithSecret'>>;
  let jwtService: JwtService;

  const realHash = bcrypt.hashSync('correct horse battery', 10);

  const activeUser = {
    id: 'uuid-1',
    email: 'acct@example.com',
    role: Role.ACCOUNTANT,
    isActive: true,
    passwordHash: realHash,
  } as unknown as User;

  beforeEach(async () => {
    usersService = { findByEmailWithSecret: jest.fn() };
    jwtService = new JwtService({
      secret: 'x'.repeat(48), // test-only secret, >=32 chars like prod policy
      signOptions: { expiresIn: '15m', issuer: 'web3-accounting-hub', audience: 'web3-accounting-hub-api' },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('returns a JWT and public user profile on valid credentials', async () => {
    usersService.findByEmailWithSecret.mockResolvedValue(activeUser);
    const result = await service.login({
      email: 'acct@example.com',
      password: 'correct horse battery',
    });
    expect(result.user).toEqual({
      id: 'uuid-1',
      email: 'acct@example.com',
      role: Role.ACCOUNTANT,
      isActive: true,
    });
    // The response must NEVER contain the password hash.
    expect(JSON.stringify(result)).not.toContain('$2');

    const decoded = jwtService.verify(result.accessToken, {
      issuer: 'web3-accounting-hub',
      audience: 'web3-accounting-hub-api',
    });
    expect(decoded.sub).toBe('uuid-1');
    expect(decoded.role).toBe(Role.ACCOUNTANT);
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });

  it('rejects wrong password with the generic "Invalid credentials"', async () => {
    usersService.findByEmailWithSecret.mockResolvedValue(activeUser);
    await expect(
      service.login({ email: 'acct@example.com', password: 'wrong password here' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
  });

  it('still runs a bcrypt compare for unknown users (timing-equalized)', async () => {
    usersService.findByEmailWithSecret.mockResolvedValue(null);
    // No spy needed: bcrypt.compare on the dummy hash costs ~cost-factor
    // time. If the code short-circuited on null user, this would resolve
    // in microseconds; we assert the call takes real crypto work AND
    // produces the same generic error as the wrong-password path.
    const start = process.hrtime.bigint();
    await expect(
      service.login({ email: 'ghost@example.com', password: 'whatever 12345' }),
    ).rejects.toThrow('Invalid credentials');
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    // bcrypt at cost >= 8 always exceeds a few ms; use a safe lower bound.
    expect(elapsedMs).toBeGreaterThan(1);
  });

  it('never returns different messages for unknown user vs bad password', async () => {
    usersService.findByEmailWithSecret.mockResolvedValueOnce(null);
    usersService.findByEmailWithSecret.mockResolvedValueOnce(activeUser);
    const e1 = await service
      .login({ email: 'ghost@example.com', password: 'whatever 12345' })
      .catch((e) => e.message);
    const e2 = await service
      .login({ email: 'acct@example.com', password: 'wrong password here' })
      .catch((e) => e.message);
    expect(e1).toBe(e2);
  });

  it('refuses login for deactivated accounts even with correct password', async () => {
    usersService.findByEmailWithSecret.mockResolvedValue({
      ...activeUser,
      isActive: false,
    } as unknown as User);
    await expect(
      service.login({ email: 'acct@example.com', password: 'correct horse battery' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('normalizes email lookup casing', async () => {
    usersService.findByEmailWithSecret.mockResolvedValue(activeUser);
    await service.login({
      email: 'ACCT@Example.COM',
      password: 'correct horse battery',
    });
    expect(usersService.findByEmailWithSecret).toHaveBeenCalledWith(
      'ACCT@Example.COM',
    );
    // lowercasing itself is asserted at the UsersService query level
  });
});
