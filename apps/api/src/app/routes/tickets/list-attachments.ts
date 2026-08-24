import type { FastifyInstance } from 'fastify'
import { eq } from'drizzle-orm'
import { db, attachments } from '@fastify-agent-console/db'

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Params: {ticketId: string }
    }>(
        '/:ticketId/attachments',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const ticketId = parseInt(request.params.ticketId, 10)

            const results = await db
                .select()
                .from(attachments)
                .where(eq(attachments.ticketId, ticketId))

            reply.send(results)
        }
    )
}