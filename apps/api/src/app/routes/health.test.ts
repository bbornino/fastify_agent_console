import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import healthRoute from './root';

async function buildApp() {
  const app = Fastify();
  await app.register(healthRoute);
  await app.ready();
  return app;
}

describe('GET /health', () => {
  it('returns status ok', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('ok');

    await app.close();
  });
});