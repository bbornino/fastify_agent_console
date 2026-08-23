import type { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, tickets } from '@fastify-agent-console/db'

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Params: { ticketId: string };
    }>(
        '/:ticketId',
        {onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const ticketId = parseInt(request.params.ticketId, 10)

            const [ticket] = await db
                .select()
                .from(tickets)
                .where(eq(tickets.id, ticketId))
                .limit(1)

            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found' })
            }

            reply.send(ticket)
        }
    )
}