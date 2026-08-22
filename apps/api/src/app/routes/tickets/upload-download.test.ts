import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import FormData from 'form-data';
import { eq } from 'drizzle-orm';
import { db, users, refreshTokens, tickets, attachments, minioClient } from '@fastify-agent-console/db';
import jwtPlugin from '../../plugins/jwt';
import cookiePlugin from '../../plugins/cookie';
import multipartPlugin from '../../plugins/multipart';
import registerRoute from '../auth/register';
import createTicketRoute from './create';
import uploadRoute from './upload';
import downloadRoute from '../attachments/download';

async function buildApp() {
  const app = Fastify();
  await app.register(jwtPlugin);
  await app.register(cookiePlugin);
  await app.register(multipartPlugin);
  await app.register(registerRoute, { prefix: '/auth' });
  await app.register(createTicketRoute, { prefix: '/tickets' });
  await app.register(uploadRoute, { prefix: '/tickets' });
  await app.register(downloadRoute, { prefix: '/attachments' });
  await app.ready();
  return app;
}

const TEST_EMAIL = 'vitest-upload-test@example.com';
const TEST_PASSWORD = 'testpassword123';
const TEST_SUBJECT = 'Vitest upload test ticket — please ignore';
const BUCKET = process.env['MINIO_BUCKET'] as string;

async function cleanupTestData() {
  const [user] = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
  const [ticket] = await db.select().from(tickets).where(eq(tickets.subject, TEST_SUBJECT)).limit(1);

  if (ticket) {
    const attachmentRows = await db.select().from(attachments).where(eq(attachments.ticketId, ticket.id));
    for (const attachment of attachmentRows) {
      await minioClient.removeObject(BUCKET, attachment.fileKey).catch(() => {});
    }
    await db.delete(attachments).where(eq(attachments.ticketId, ticket.id));
    await db.delete(tickets).where(eq(tickets.id, ticket.id));
  }

  if (user) {
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    await db.delete(users).where(eq(users.id, user.id));
  }
}

describe('Ticket attachments', () => {
  let accessToken: string;
  let ticketId: number;

  beforeAll(async () => {
    await cleanupTestData();
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD, name: 'Vitest Upload User' },
    });
    accessToken = JSON.parse(registerResponse.body).accessToken;

    const ticketResponse = await app.inject({
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
    ticketId = JSON.parse(ticketResponse.body).id;

    await app.close();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  it('uploads a file and creates an attachment record', async () => {
    const app = await buildApp();

    const form = new FormData();
    form.append('file', Buffer.from('vitest test file contents'), {
      filename: 'vitest-test.txt',
      contentType: 'text/plain',
    });

    const response = await app.inject({
      method: 'POST',
      url: `/tickets/${ticketId}/attachments`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
      payload: form.getBuffer(),
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.fileName).toBe('vitest-test.txt');
    expect(body.ticketId).toBe(ticketId);

    await app.close();
  });

  it('downloads the uploaded file with correct content', async () => {
    const app = await buildApp();

    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.ticketId, ticketId))
      .limit(1);

    const response = await app.inject({
      method: 'GET',
      url: `/attachments/${attachment.id}/download`,
      headers: { authorization: `Bearer ${accessToken}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('vitest test file contents');

    await app.close();
  });

  it('rejects upload to a nonexistent ticket with 404', async () => {
    const app = await buildApp();

    const form = new FormData();
    form.append('file', Buffer.from('irrelevant'), {
      filename: 'irrelevant.txt',
      contentType: 'text/plain',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/tickets/999999/attachments',
      headers: {
        authorization: `Bearer ${accessToken}`,
        ...form.getHeaders(),
      },
      payload: form.getBuffer(),
    });

    expect(response.statusCode).toBe(404);

    await app.close();
  });
});