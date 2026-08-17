import type { FastifyInstance } from "fastify"
import crypto from 'crypto'
import { eq, and, isNull } from 'drizzle-orm'
import { db, refreshTokens } from '@fastify-agent-console/db'
import { REFRESH_COOKIE_OPTIONS } from "../../constants"

export default async function ( fastify: FastifyInstance) {
    fastify.post('/logout', async (request, reply) => {
        const refreshToken = request.cookies.refreshToken
        if (!refreshToken) {
            return reply.code(400).send({ error: 'Refresh token rquired'})
        }

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

        await db
                .update(refreshTokens)
                .set({revokedAt: new Date() })
                .where(
                    and(
                        eq(refreshTokens.tokenHash, tokenHash),
                        isNull(refreshTokens.revokedAt)
                    )
                )

        reply.clearCookie('refreshToken', {path: REFRESH_COOKIE_OPTIONS.path})
        reply.send({message: 'Logged out successfully'})
    })
}