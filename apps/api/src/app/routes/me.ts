import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, users } from '@fastify-agent-console/db'

export default async function (fastify: FastifyInstance) {
    fastify.get(
        '/me',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const { userId } = request.user as { userId: number; role: string}
            const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, userId))
                    .limit(1)

            if (!user) {
                return reply.code(404).send({ error: 'User not found'})
            }

            reply.send({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
            })
        }
    )
}