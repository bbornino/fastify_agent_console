import type { FastifyInstance } from "fastify"
import multipart from '@fastify/multipart'
import fp from 'fastify-plugin'

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10 MB
        }
    })
})