import type { FastifyInstance } from "fastify";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { db, users, refreshTokens } from '@fastify-agent-console/db'
import { eq } from 'drizzle-orm'
import { REFRESH_TOKEN_EXPIRY_MS } from "../../constants"

export default async function (fastify: FastifyInstance) {
    fastify.post<{
        Body: { email: string; password: string; name: string };
    }>('/register', async (request, reply) => {
        const { email, password, name } = request.body

        const [existingUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
                .limit(1)
        if (existingUser) {
            return reply.code(409).send({error: 'Email already registered'})
        }
        
        const passwordHash = await bcrypt.hash(password, 10)
        const [user] = await db
                .insert(users)
                .values({email, passwordHash, name, updatedAt: new Date(),}).returning()
        
        const accessToken = fastify.jwt.sign({ userId: user.id, role: user.role})
        const rawRefreshToken = crypto.randomBytes(40).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')

        await db.insert(refreshTokens).values({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS), // 30 days
        })

        reply.setCookie('refreshToken', rawRefreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/auth',
            maxAge: REFRESH_TOKEN_EXPIRY_MS / 1000,     // seconds not ms
        })

        reply.code(201).send({
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
            accessToken,
            // refreshToken: rawRefreshToken,
        })
    })
}