import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 254 })
  email: string;

  /**
   * bcrypt hash (cost 12). `select: false` means the hash is never
   * returned by ordinary find() queries — it must be explicitly opted
   * into (UsersService.findByEmailWithSecret) so it cannot leak via an
   * accidental serialization of an entity.
   */
  @Column({ type: 'varchar', length: 100, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: Role, default: Role.VIEWER })
  role: Role;

  /** Soft-disabled accounts cannot log in. Used instead of hard deletes
   *  because accounting records must retain their authorship trail. */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
