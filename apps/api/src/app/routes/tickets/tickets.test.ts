import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens, tickets } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from '../auth/register';
import createRoute from './create';
import listRoute from './list';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(createRoute, { prefix: '/tickets' });
  await app.register(listRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-tickets-test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_SUBJECT = 'Vitest test ticket — please ignore';

async function cleanupTestData() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  await db.delete(tickets).where(eq(tickets.subject, TEST_SUBJECT));
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

async function getTestAccessToken(app: ReturnType<typeof Fastify>) {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Tickets User' },
  });
  return JSON.parse(response.body).accessToken;
}

describe('Tickets', () => {
  let accessToken: string;

  beforeAll(async () => {
    await cleanupTestData();
    const app = await buildApp();
    accessToken = await getTestAccessToken(app);
    await app.close();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /tickets', () => {
    it('creates a ticket with valid data', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          subject: TEST_SUBJECT,
          description: 'Test description',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.subject).toBe(TEST_SUBJECT);
      expect(body.status).toBe('new');
      expect(body.priority).toBe('medium');

      await app.close();
    });

    it('rejects ticket creation with no auth token', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: '/tickets',
        payload: {
          subject: 'Unauthorized attempt',
          description: 'Should not be created',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        },
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });
  });

  describe('GET /tickets', () => {
    it('returns a list including the ticket we created', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((t: { subject: string }) => t.subject === TEST_SUBJECT)).toBe(true);

      await app.close();
    });
  });
});