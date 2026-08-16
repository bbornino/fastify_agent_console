import type { FastifyInstance } from "fastify";
import cookie from '@fastify/cookie'
import fp from 'fastify-plugin'

export default fp(async function (fastify: FastifyInstance) {
    fastify.register(cookie, {
        secret: process.env['COOKIE_SECRET'] as string,
    })
})