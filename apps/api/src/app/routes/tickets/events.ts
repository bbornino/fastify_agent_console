import type { FastifyInstance } from "fastify"
import { addClient, removeClient } from "../../lib/ticket-events"

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Querystring: { token?: string}
    }>('/events', async (request, reply) => {
        const token = request.query.token

        if (!token) {
            return reply.code(401).send({ error: 'Unauthorized'})
        }

        try {
            fastify.jwt.verify(token)
        } catch {
            return reply.code(401).send({ error: 'Unauthorized' })
        }

        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        })

        addClient(reply)

        // Send an initial comment to establish the connection immediately
        reply.raw.write(': connected\n\n')

        request.raw.on('close', () => {
            removeClient(reply)
        })
    })
}