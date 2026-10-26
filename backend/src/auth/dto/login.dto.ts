import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email: string;

  // No MinLength here on purpose: rejecting short passwords at the DTO
  // layer would leak information about stored-account policy and enable a
  // cheap user-enumeration oracle. The bcrypt compare handles it.
  @IsString()
  @MaxLength(128)
  password: string;
}
