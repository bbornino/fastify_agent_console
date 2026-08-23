import { describe, it, expect, vi } from 'vitest';
import type { FastifyReply } from 'fastify';
import { addClient, removeClient, broadcastTicketEvent } from './ticket-events';

function createFakeReply() {
  return {
    raw: { write: vi.fn() },
  } as unknown as FastifyReply;
}

describe('ticket-events broadcaster', () => {
  it('writes the event to all added clients', () => {
    const client1 = createFakeReply();
    const client2 = createFakeReply();

    addClient(client1);
    addClient(client2);

    broadcastTicketEvent({ type: 'created', ticketId: 123 });

    expect(client1.raw.write).toHaveBeenCalledWith(
      'data: {"type":"created","ticketId":123}\n\n'
    );
    expect(client2.raw.write).toHaveBeenCalledWith(
      'data: {"type":"created","ticketId":123}\n\n'
    );

    removeClient(client1);
    removeClient(client2);
  });

  it('does not write to a client after it has been removed', () => {
    const client = createFakeReply();

    addClient(client);
    removeClient(client);

    broadcastTicketEvent({ type: 'updated', ticketId: 456 });

    expect(client.raw.write).not.toHaveBeenCalled();
  });
});