import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../plugins/jwt';
import cookiePlugin from '../plugins/cookie';
import registerRoute from './auth/register';
import meRoute from './me';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(meRoute);
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-me-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function cleanupTestUser() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('GET /me', () => {
  beforeAll(async () => {
    await cleanupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('returns the authenticated user with a valid token', async () => {
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Me User' },
    });

    const { accessToken } = JSON.parse(registerResponse.body);

    const meResponse = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(meResponse.statusCode).toBe(200);
    const body = JSON.parse(meResponse.body);
    expect(body.email).toBe(TEST_EMAIL);
    expect(body.name).toBe('Vitest Me User');

    await app.close();
  });

  it('rejects a request with no token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/me',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('rejects a request with an invalid token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/me',
      headers: { authorization: 'Bearer not-a-real-token' },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});