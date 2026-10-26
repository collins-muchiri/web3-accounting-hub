import { validateEnv } from '../src/config/env.validation';

describe('environment validation', () => {
  const validBase = {
    NODE_ENV: 'test',
    DATABASE_HOST: 'db',
    POSTGRES_USER: 'app',
    POSTGRES_PASSWORD: 'a-strong-random-password',
    POSTGRES_DB: 'accounting_finance',
    JWT_SECRET: 'x'.repeat(32),
  };

  it('accepts a complete, strong configuration', () => {
    expect(() => validateEnv(validBase)).not.toThrow();
  });

  it('rejects missing JWT_SECRET', () => {
    const { JWT_SECRET: _ignored, ...rest } = validBase;
    expect(() => validateEnv(rest)).toThrow(/JWT_SECRET/);
  });

  it('rejects weak (short) JWT_SECRET', () => {
    expect(() =>
      validateEnv({ ...validBase, JWT_SECRET: 'short' }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects missing database credentials instead of using defaults', () => {
    const { POSTGRES_PASSWORD: _ignored, ...rest } = validBase;
    expect(() => validateEnv(rest)).toThrow(/POSTGRES_PASSWORD/);
  });

  it('does not leak secret values in error messages', () => {
    const weakSecret = 'weak-secret-value';
    const weakPassword = 'weak-password-value';
    let message = '';
    try {
      validateEnv({
        ...validBase,
        JWT_SECRET: weakSecret,
        POSTGRES_PASSWORD: weakPassword,
      });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toContain('JWT_SECRET'); // names are fine…
    expect(message).not.toContain(weakSecret); // …values must never appear
    expect(message).not.toContain(weakPassword);
  });
});
