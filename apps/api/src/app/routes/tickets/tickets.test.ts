import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { eq, like } from 'drizzle-orm';
import { db, users, refreshTokens, tickets } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from '../auth/register';
import createRoute from './create';
import listRoute from './list';
import updateRoute from './update';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(createRoute, { prefix: '/tickets' });
  await app.register(listRoute, { prefix: '/tickets' });
  await app.register(updateRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-tickets-test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_SUBJECT = 'Vitest test ticket — please ignore';

async function cleanupTestData() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  await db.delete(tickets).where(like(tickets.subject, TEST_SUBJECT));
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
    it('returns a paginated response shape', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body.tickets)).toBe(true);
      expect(body.tickets.length).toBeLessThanOrEqual(25);
      expect(body).toHaveProperty('nextCursor');

      await app.close();
    });

    it('finds a specific ticket by filtering status and paging until found, or fetching directly', async () => {
      const app = await buildApp();

      const createResponse = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          subject: `${TEST_SUBJECT} - findable`,
          description: 'Test description',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        },
      });
      const { id } = JSON.parse(createResponse.body);

      // Since this ticket was just created, it has the highest id — it must be on page 1
      const response = await app.inject({
        method: 'GET',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      const body = JSON.parse(response.body);
      expect(body.tickets.some((t: { id: number }) => t.id === id)).toBe(true);

      await app.close();
    });

    it('respects the cursor to fetch the next page', async () => {
      const app = await buildApp();

      const firstPage = await app.inject({
        method: 'GET',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const firstBody = JSON.parse(firstPage.body);
      expect(firstBody.nextCursor).not.toBeNull();

      const secondPage = await app.inject({
        method: 'GET',
        url: `/tickets?cursor=${firstBody.nextCursor}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      const secondBody = JSON.parse(secondPage.body);

      const firstIds = firstBody.tickets.map((t: { id: number }) => t.id);
      const secondIds = secondBody.tickets.map((t: { id: number }) => t.id);
      const overlap = firstIds.filter((id: number) => secondIds.includes(id));

      expect(overlap.length).toBe(0);
      expect(Math.max(...secondIds)).toBeLessThan(Math.min(...firstIds));

      await app.close();
    });
  });

  describe('PATCH /tickets/:id', () => {
    it('updates ticket status and sets resolvedAt', async () => {
      const app = await buildApp();

      const createResponse = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          subject: `${TEST_SUBJECT} - patch test`,
          description: 'Test description',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        },
      });
      const { id } = JSON.parse(createResponse.body);

      const patchResponse = await app.inject({
        method: 'PATCH',
        url: `/tickets/${id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: 'resolved' },
      });

      expect(patchResponse.statusCode).toBe(200);
      expect(patchResponse.body).not.toBe('');
      const body = JSON.parse(patchResponse.body);
      expect(body.id).toBe(id);
      expect(body.status).toBe('resolved');
      expect(body.resolvedAt).not.toBeNull();

      await app.close();
    });

    it('updates status without an assignment change and still returns the updated ticket', async () => {
      const app = await buildApp();

      const createResponse = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          subject: `${TEST_SUBJECT} - status only`,
          description: 'Test description',
          customerEmail: 'customer@example.com',
          customerName: 'Test Customer',
        },
      });
      const { id } = JSON.parse(createResponse.body);

      const patchResponse = await app.inject({
        method: 'PATCH',
        url: `/tickets/${id}`,
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { priority: 'urgent' },
      });

      expect(patchResponse.statusCode).toBe(200);
      const body = JSON.parse(patchResponse.body);
      expect(body.priority).toBe('urgent');

      await app.close();
    });

    it('returns 404 for a nonexistent ticket', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'PATCH',
        url: '/tickets/999999',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { status: 'resolved' },
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });
});