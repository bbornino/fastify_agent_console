import type { FastifyInstance } from "fastify"

export default async function(fastify: FastifyInstance) {
    fastify.get('/google', async (request, reply) => {
        const params = new URLSearchParams({
            client_id: process.env['GOOGLE_CLIENT_ID'] as string,
            redirect_uri: process.env['GOOGLE_REDIRECT_URI'] as string,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        })

        reply.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
    })
}