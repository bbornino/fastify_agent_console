import type { FastifyInstance } from "fastify";
import cors from '@fastify/cors'
import fp from 'fastify-plugin'

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(cors, {
        origin: 'http://localhost:4200',
        credentials: true,
    })
})