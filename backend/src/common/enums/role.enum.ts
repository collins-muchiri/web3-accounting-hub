/**
 * Application roles for RBAC. Kept in one place so the JWT payload,
 * the database enum and the @Roles() guard metadata can never drift apart.
 */
export enum Role {
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  VIEWER = 'viewer',
}
