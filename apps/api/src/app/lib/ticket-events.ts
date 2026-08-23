import type { FastifyReply } from "fastify"

const clients = new Set<FastifyReply>()

export function addClient(reply: FastifyReply) {
    clients.add(reply)
}

export function removeClient(reply: FastifyReply) {
    clients.delete(reply)
}

export function broadcastTicketEvent(event: { type: 'created' | 'updated'; ticketId: number }) {
    const payload = `data: ${JSON.stringify(event)}\n\n`
    for (const client of clients) {
        client.raw.write(payload)
    }
}