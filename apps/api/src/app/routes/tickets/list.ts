import type { FastifyInstance } from "fastify"
import { desc } from 'drizzle-orm'
import { db, tickets } from '@fastify-agent-console/db'

export default async function (fastify: FastifyInstance) {
    fastify.get(
        '/',
        { onRequest: [fastify.authenticate]},
        async (request, reply) => {
            const allTickets = await db
                .select()
                .from(tickets)
                .orderBy(desc(tickets.createdAt))

            reply.send(allTickets)
        }
    )
}