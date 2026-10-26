import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService, toPublicUser } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

export interface LoginResult {
  accessToken: string;
  user: ReturnType<typeof toPublicUser>;
}

/** Fixed-width fake hash compared when the user does not exist, so that
 *  response timing does not reveal whether an email is registered. */
const DUMMY_HASH =
  '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7ZBp7NdgYq0lX0D0mKQ9p3u5xVjJjJm';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResult> {
    const user: User | null = await this.usersService.findByEmailWithSecret(
      dto.email,
    );

    // Always run a bcrypt compare (real or against the dummy hash) to keep
    // timing uniform between "unknown user" and "wrong password".
    const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await bcrypt.compare(dto.password, hashToCheck);

    if (!user || !passwordOk || !user.isActive) {
      // One generic message for every failure mode — no enumeration oracle.
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // Never log emails/passwords/tokens; only an opaque audit event.
    this.logger.log(`Successful login for user ${user.id}`);
    return { accessToken, user: toPublicUser(user) };
  }
}
