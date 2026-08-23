import type { FastifyInstance } from "fastify"
import fastifyMetrics from 'fastify-metrics'
import fp from 'fastify-plugin'

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(fastifyMetrics, {
        endpoint: '/metrics',
    })
})