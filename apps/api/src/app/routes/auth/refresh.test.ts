import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from './register';
import loginRoute from './login';
import refreshRoute from './refresh';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(loginRoute, { prefix: '/auth' });
  await app.register(refreshRoute, { prefix: '/auth' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-refresh-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function cleanupTestUser() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

function extractCookie(setCookieHeader: string | string[] | undefined): string {
  const raw = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  return raw?.split(';')[0] ?? '';
}

describe('POST /auth/refresh', () => {
  beforeAll(async () => {
    await cleanupTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('issues a new access token given a valid refresh cookie', async () => {
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Refresh User' },
    });

    const cookie = extractCookie(registerResponse.headers['set-cookie']);

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie },
    });

    expect(refreshResponse.statusCode).toBe(200);
    const body = JSON.parse(refreshResponse.body);
    expect(body.accessToken).toBeDefined();

    await app.close();
  });

  it('rejects a request with no refresh cookie', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('rejects a reused (already-rotated) refresh cookie', async () => {
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'vitest-refresh-rotate@example.com', password: TEST_PASSWORD, name: 'Rotate Test' },
    });

    const originalCookie = extractCookie(registerResponse.headers['set-cookie']);

    // First refresh — should succeed and rotate the token
    await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: originalCookie },
    });

    // Reusing the same (now-revoked) original cookie should fail
    const secondAttempt = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      headers: { cookie: originalCookie },
    });

    expect(secondAttempt.statusCode).toBe(401);

    // cleanup this extra user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'vitest-refresh-rotate@example.com'))
      .limit(1);
    if (user) {
      await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
      await db.delete(users).where(eq(users.id, user.id));
    }

    await app.close();
  });
});


