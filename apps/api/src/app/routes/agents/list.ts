import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, users } from '@fastify-agent-console/db'

export default async function (fastify: FastifyInstance) {
    fastify.get(
        '/',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const agents = await db
                .select({id: users.id, name: users.name })
                .from(users)
                .where(eq(users.role, 'agent'))

                reply.send(agents)
        }
    )
}