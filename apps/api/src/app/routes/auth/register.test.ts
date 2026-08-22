import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from './register';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.ready();
  return app;
}

async function cleanupTestUser() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

const TEST_EMAIL = 'vitest-register-test@example.com';

describe('POST /auth/register', () => {
  beforeEach(async () => {
     await cleanupTestUser();
  });

  afterAll(async () => {
     await cleanupTestUser();
  });

  it('creates a new user and returns an access token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: TEST_EMAIL,
        password: 'testpassword123',
        name: 'Vitest User',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.user.email).toBe(TEST_EMAIL);
    expect(body.accessToken).toBeDefined();

    await app.close();
  });

  it('rejects a duplicate email with 409', async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: TEST_EMAIL,
        password: 'testpassword123',
        name: 'Vitest User',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: TEST_EMAIL,
        password: 'testpassword123',
        name: 'Vitest User Two',
      },
    });

    expect(response.statusCode).toBe(409);

    await app.close();
  });
});