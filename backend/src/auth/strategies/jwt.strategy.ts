import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../common/enums/role.enum';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  /** subject: user id (uuid) */
  sub: string;
  email: string;
  role: Role;
}

export interface AuthenticatedUser extends JwtPayload {
  id: string;
}

/**
 * Verifies every request's bearer token:
 *  - signature via JWT_SECRET (validated >=32 chars at boot),
 *  - issuer/audience pinned so tokens minted for other services are rejected,
 *  - then re-checks the user still exists and is active in the DB, so a
 *    deactivated account cannot keep using an unexpired token.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      issuer: 'web3-accounting-hub',
      audience: 'web3-accounting-hub-api',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub || !Object.values(Role).includes(payload.role)) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    return { id: user.id, sub: payload.sub, email: payload.email, role: payload.role as Role };
  }
}
