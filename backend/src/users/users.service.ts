import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

const BCRYPT_ROUNDS = 12;

export interface PublicUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    const existing = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
    });
    const saved = await this.usersRepo.save(user);
    return toPublicUser(saved);
  }

  /**
   * Explicitly opts into the `select: false` password hash. Callers MUST
   * use the result only for immediate bcrypt comparison and never store,
   * log, or serialize it.
   */
  async findByEmailWithSecret(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return toPublicUser(user);
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    return users.map(toPublicUser);
  }

  /** Admin-only deactivation (soft delete preserving accounting trail). */
  async deactivate(id: string): Promise<PublicUser> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    await this.usersRepo.save(user);
    return toPublicUser(user);
  }
}
