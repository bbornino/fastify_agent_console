import type { FastifyInstance } from "fastify"
import { desc, lt, and, eq } from 'drizzle-orm'
import { db, tickets } from '@fastify-agent-console/db'

const PAGE_SIZE = 25

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Querystring: {cursor?: string; status?: string}
    }>(
        '/',
        { onRequest: [fastify.authenticate]},
        async (request, reply) => {
            const { cursor, status } = request.query

            const conditions = []

            if (status) {
                conditions.push(eq(tickets.status, status as any))
            }
            if (cursor) {
                const cursorId = parseInt(cursor, 10)
                conditions.push(lt(tickets.id, cursorId))
            }
            const results = await db
                .select()
                .from(tickets)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(desc(tickets.id))
                .limit(PAGE_SIZE + 1)

            const hasMore = results.length > PAGE_SIZE
            const page = hasMore ? results.slice(0, PAGE_SIZE) : results
            const nextCursor = hasMore ? page[page.length - 1].id : null

            reply.send({
                tickets: page,
                nextCursor
            })
        }
    )
}