import type { FastifyInstance } from "fastify"
import crypto from 'crypto'
import { eq, and, isNull, gt } from 'drizzle-orm'
import { db, users, refreshTokens } from '@fastify-agent-console/db'

export default async function ( fastify: FastifyInstance) {
    fastify.post<{
        Body: { refreshToken: string }
    }>('/refresh', async (request, reply) => {
        const { refreshToken } = request.body
        if (!refreshToken) {
            return reply.code(400).send({ error: 'Refresh token required'})
        }

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')

        const [tokenRow] = await db
                .select()
                .from(refreshTokens)
                .where(
                    and(
                        eq(refreshTokens.tokenHash, tokenHash),
                        isNull(refreshTokens.revokedAt),
                        gt(refreshTokens.expiresAt, new Date())
                    )
                )
                .limit(1)

        if (!tokenRow) {
            return reply.code(401).send({ error: 'Invalid or expired refresh token'})
        }

        const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, tokenRow.userId))
                .limit(1)

        if (!user || !user.isActive) {
            return reply.code(401).send({ error: 'Invalid or expired refresh token' })
        }

        // Rotate: revoke the old token, issue a new one
        await db
                .update(refreshTokens)
                .set({revokedAt: new Date() })
                .where(eq(refreshTokens.id, tokenRow.id))

        const newRawRefreshToken = crypto.randomBytes(40).toString('hex')
        const newTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex')

        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash: newTokenHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })

        const accessToken = fastify.jwt.sign({ userId: user.id, role: user.role})

        reply.send({
            accessToken,
            refreshToken: newRawRefreshToken,
        })
    })
}