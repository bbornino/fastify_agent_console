import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from './register';
import logoutRoute from './logout';
import refreshRoute from './refresh';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(logoutRoute, { prefix: '/auth' });
  await app.register(refreshRoute, { prefix: '/auth' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-logout-test@example.com';
const TEST_PASSWORD = 'testpassword123';

function extractCookie(setCookieHeader: string | string[] | undefined): string {
  const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return raw?.split(';')[0] ?? '';
}

async function cleanupTestUser() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('POST /auth/logout', () => {
  beforeAll(async () => {
    await cleanupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('logs out successfully and revokes the refresh token', async () => {
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Logout User' },
    });

    const cookie = extractCookie(registerResponse.headers['set-cookie']);

    const logoutResponse = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: { cookie },
    });

    expect(logoutResponse.statusCode).toBe(200);

    // The same cookie should no longer work for a refresh
    const refreshAttempt = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie },
    });

    expect(refreshAttempt.statusCode).toBe(401);

    await app.close();
  });

  it('returns success even with no cookie present', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });
});