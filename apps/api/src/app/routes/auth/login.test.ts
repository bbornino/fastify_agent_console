import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from './register';
import loginRoute from './login';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(loginRoute, { prefix: '/auth' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-login-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function cleanupTestUser() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('POST /auth/login', () => {
  beforeAll(async () => {
    await cleanupTestUser();
    const app = await buildApp();
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Login User' },
    });
    await app.close();
  });

  afterAll(async () => {
    await cleanupTestUser();
  });

  it('logs in successfully with correct credentials', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.accessToken).toBeDefined();

    await app.close();
  });

  it('rejects an incorrect password with 401', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: TEST_EMAIL, password: 'wrongpassword' },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('rejects a nonexistent email with 401', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'nobody@example.com', password: TEST_PASSWORD },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});