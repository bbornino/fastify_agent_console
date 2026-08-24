import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from '../auth/register';
import listRoute from './list';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(listRoute, { prefix: '/agents' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-agents-test@example.com';
const TEST_PASSWORD = 'testpassword123';

async function cleanupTestData() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('GET /agents', () => {
  let accessToken: string;

  beforeAll(async () => {
    await cleanupTestData();
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Agents User' },
    });
    accessToken = JSON.parse(registerResponse.body).accessToken;

    await app.close();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('returns a list of agents with only id and name', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/agents',
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    for (const agent of body) {
      expect(Object.keys(agent).sort()).toEqual(['id', 'name']);
      expect(agent).not.toHaveProperty('passwordHash');
      expect(agent).not.toHaveProperty('email');
    }

    await app.close();
  });

  it('rejects a request with no auth token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/agents',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});