import type { FastifyInstance } from "fastify"
import crypto from 'crypto'
import { eq, or } from 'drizzle-orm'
import { OAuth2Client } from 'google-auth-library'
import { db, users, refreshTokens } from '@fastify-agent-console/db'

const googleClient =  new OAuth2Client(
    process.env['GOOGLE_CLIENT_ID'],
    process.env['GOOGLE_CLIENT_SECRET'],
    process.env['GOOGLE_REDIRECT_URI'],
)

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Querystring: { code: string}
    }>('/google/callback', async (request, reply) => {
        const { code } = request.query
        if (!code) {
            return reply.code(400).send({ error: 'Missing authorization code'})
        }

        const { tokens } = await googleClient.getToken(code)
        const ticket = await googleClient.verifyIdToken({
            idToken: tokens.id_token as string,
            audience: process.env['GOOGLE_CLIENT_ID']
        })

        const payload = ticket.getPayload()
        if (!payload || !payload.email) {
            return reply.code(401).send({ error: 'Google authentication failed'})
        }

        const googleId = payload.sub
        const email = payload.email
        const name = payload.name ?? email
        const avatarUrl = payload.picture ?? null

        let [user] = await db
                .select()
                .from(users)
                .where(or(eq(users.googleId, googleId), eq(users.email, email)))
                .limit(1)
        
        if (user) {
            if (!user.googleId) {
                await db
                        .update(users)
                        .set({ googleId, avatarUrl: user.avatarUrl ?? avatarUrl})
                        .where(eq(users.id, user.id))
            }
        } else {
            [user] = await db
                    .insert(users)
                    .values({
                        email,
                        googleId,
                        name,
                        avatarUrl,
                        updatedAt: new Date(),
                    })
                    .returning()
        }

        const accessToken = fastify.jwt.sign({ userId: user.id, role: user.role })
        const rawRefreshToken = crypto.randomBytes(40).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')

        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })

        await db
                .update(users)
                .set({ lastLoginAt: new Date()})
                .where(eq(users.id, user.id))

        // Redirect back to the frontend with tokens as query params
        reply.redirect(
            `http://localhost:4200/auth/callback?accessToken=${accessToken}&refreshToken=${rawRefreshToken}`
        )
    })
}