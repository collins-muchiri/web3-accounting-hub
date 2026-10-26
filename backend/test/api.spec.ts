import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { Role } from '../common/enums/role.enum';

/**
 * E2E smoke test for the HTTP surface: routing, global validation pipe,
 * JWT auth enforcement and RBAC. The real TypeORM/Postgres layer is NOT
 * started — UsersService is mocked so no database is required (keeps CI
 * hermetic). A Postgres-backed variant should run in an optional job once
 * migrations exist.
 */
describe('API (e2e, mocked persistence)', () => {
  let app: INestApplication;
  const jwt = new JwtService({
    secret: 'test-secret-012345678901234567890123456789', // >=32 chars like prod policy
    signOptions: { expiresIn: '15m' },
  });

  const tokenFor = (role: Role) =>
    jwt.sign({ sub: 'uuid-1', email: 'u@example.com', role });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(UsersService)
      .useValue({
        findById: async (id: string) => ({
          id,
          email: 'u@example.com',
          role: Role.VIEWER,
          isActive: true,
        }),
        findByEmailWithSecret: async () => null,
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health is public and returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('POST /auth/login rejects malformed bodies with 400', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /auth/login returns generic 401 for unknown user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'whatever 12345678' })
      .expect(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('GET /transactions requires authentication', async () => {
    await request(app.getHttpServer()).get('/transactions').expect(401);
  });

  it('GET /transactions accepts a valid bearer token', async () => {
    await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${tokenFor(Role.VIEWER)}`)
      .expect(200);
  });

  it('rejects tokens signed with the wrong secret', async () => {
    const forged = new JwtService({ secret: 'wrong-secret-wrong-secret-wrong-secret!!' }).sign({
      sub: 'uuid-1',
      email: 'admin@example.com',
      role: Role.ADMIN,
    });
    await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${forged}`)
      .expect(401);
  });

  it('POST /transactions forbids VIEWER writes (RBAC enforced end-to-end)', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${tokenFor(Role.VIEWER)}`)
      .send({
        type: 'EXPENSE',
        amountCents: 1250,
        currency: 'USD',
        description: 'coffee',
        category: 'meals',
        occurredAt: '2026-10-26T10:00:00Z',
      })
      .expect(403);
  });

  it('POST /transactions rejects float amounts at the validation boundary', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${tokenFor(Role.ACCOUNTANT)}`)
      .send({
        type: 'EXPENSE',
        amountCents: 12.5, // must be integer minor units
        currency: 'USD',
        description: 'coffee',
        category: 'meals',
        occurredAt: '2026-10-26T10:00:00Z',
      })
      .expect(400);
  });

  it('POST /transactions rejects unknown extra fields (whitelist)', async () => {
    await request(app.getHttpServer())
      .post('/transactions')
      .set('Authorization', `Bearer ${tokenFor(Role.ACCOUNTANT)}`)
      .send({
        type: 'EXPENSE',
        amountCents: 100,
        currency: 'USD',
        description: 'x',
        category: 'y',
        occurredAt: '2026-10-26T10:00:00Z',
        role: Role.ADMIN, // mass-assignment attempt
      })
      .expect(400);
  });
});
