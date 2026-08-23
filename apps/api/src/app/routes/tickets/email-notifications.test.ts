import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens, tickets } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import registerRoute from '../auth/register';
import createRoute from './create';
import updateRoute from './update';

const MAILHOG_API = 'http://localhost:8026/api/v2/messages';

async function clearMailhog() {
  await fetch('http://localhost:8026/api/v1/messages', { method: 'DELETE' });
}

async function getMailhogMessages() {
  const res = await fetch(MAILHOG_API);
  const data = await res.json();
  return data.items as Array<{
    Content: { Headers: { Subject: string[]; To: string[] } };
  }>;
}

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(createRoute, { prefix: '/tickets' });
  await app.register(updateRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-email-test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_SUBJECT = 'Vitest email notification test — please ignore';
const AGENT_EMAIL = 'alex.agent@agentconsole.test';

async function cleanupTestData() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  await db.delete(tickets).where(eq(tickets.subject, TEST_SUBJECT));
  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('Ticket email notifications', () => {
  let accessToken: string;
  let agentId: number;

  beforeAll(async () => {
    await cleanupTestData();
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Email User' },
    });
    accessToken = JSON.parse(registerResponse.body).accessToken;

    const [agent] = await db.select().from(users).where(eq(users.email, AGENT_EMAIL)).limit(1);
    if (!agent) {
      throw new Error(
        `Seeded agent ${AGENT_EMAIL} not found — run "pnpm seed" before running this test file.`
      );
    }
    agentId = agent.id;

    await app.close();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    await clearMailhog();
  });

  it('sends an email to the agent when a ticket is assigned', async () => {
    const app = await buildApp();

    const createResponse = await app.inject({
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
    const { id } = JSON.parse(createResponse.body);

    await app.inject({
      method: 'PATCH',
      url: `/tickets/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { assignedAgentId: agentId },
    });

    // Give the fire-and-forget email a moment to actually send
    await new Promise((resolve) => setTimeout(resolve, 300));

    const messages = await getMailhogMessages();
    const match = messages.find((m) =>
      m.Content.Headers.Subject[0].includes(`Ticket #${id} assigned to you`)
    );

    expect(match).toBeDefined();
    expect(match?.Content.Headers.To[0]).toContain(AGENT_EMAIL);

    await app.close();
  });

  it('sends an email to the customer when a ticket is resolved', async () => {
    const app = await buildApp();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/tickets',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        subject: TEST_SUBJECT,
        description: 'Test description',
        customerEmail: 'vitest-customer@example.com',
        customerName: 'Vitest Customer',
      },
    });
    const { id } = JSON.parse(createResponse.body);

    await app.inject({
      method: 'PATCH',
      url: `/tickets/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { status: 'resolved' },
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const messages = await getMailhogMessages();
    const match = messages.find((m) =>
      m.Content.Headers.Subject[0].includes(`Your ticket #${id} has been resolved`)
    );

    expect(match).toBeDefined();
    expect(match?.Content.Headers.To[0]).toContain('vitest-customer@example.com');

    await app.close();
  });

  it('does not send an email when priority changes without status/assignment changes', async () => {
    const app = await buildApp();

    const createResponse = await app.inject({
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
    const { id } = JSON.parse(createResponse.body);

    await clearMailhog();

    await app.inject({
      method: 'PATCH',
      url: `/tickets/${id}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { priority: 'urgent' },
    });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const messages = await getMailhogMessages();
    expect(messages.length).toBe(0);

    await app.close();
  });
});