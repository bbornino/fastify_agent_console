import type { FastifyInstance } from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'
import { ACCESS_TOKEN_EXPIRY } from '../constants'

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    }
}

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(fastifyJwt, {
        secret: process.env['JWT_ACCESS_SECRET'] as string,
        sign: { expiresIn: ACCESS_TOKEN_EXPIRY},
    })

    fastify.decorate('authenticate', async function (request, reply) {
        try {
            await request.jwtVerify()
        } catch (err) {
            reply.code(401).send({ error: 'Unauthorized'})
        }
    })
})