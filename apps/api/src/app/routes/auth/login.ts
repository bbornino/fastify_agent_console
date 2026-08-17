import type { FastifyInstance } from "fastify";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db, users, refreshTokens } from '@fastify-agent-console/db'
import { REFRESH_TOKEN_EXPIRY_MS, REFRESH_COOKIE_OPTIONS  } from "../../constants";

export default async function (fastify: FastifyInstance) {
    fastify.post<{
        Body: { email: string; password: string }
    }>('/login', async (request, reply) => {
        const {email, password } = request.body
        const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1)
        if (!user || !user.passwordHash) {
            return reply.code(401).send({ error: 'Invalid email or password'})
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatches) {
            return reply.code(401).send({error: 'Invalid email or password'})
        }

        const accessToken = fastify.jwt.sign({ userId: user.id, role: user.role})
        const rawRefreshToken = crypto.randomBytes(40).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')

        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
        })

        await db
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, user.id))

        reply.setCookie('refreshToken', rawRefreshToken, REFRESH_COOKIE_OPTIONS)
        reply.send({
            user: { id: user.id, email: user.email, name: user.name, role: user.role},
            accessToken,
            // refreshToken: rawRefreshToken,
        })
    })
}