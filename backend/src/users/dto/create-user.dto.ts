import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  // Raw password accepted ONLY here; response DTOs never echo it back and
  // the service persists only a bcrypt hash.
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @MaxLength(128, { message: 'Password too long (bcrypt input limit)' })
  password: string;

  @IsEnum(Role)
  role: Role;
}
