import type { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, attachments, minioClient } from '@fastify-agent-console/db'

const BUCKET = process.env['MINIO_BUCKET'] as string

export default async function (fastify: FastifyInstance) {
    fastify.get<{
        Params: { attachmentId: string }
    }>(
        '/:attachmentId/download',
        { onRequest: [fastify.authenticate]},
        async (request, reply) => {
            const attachmentId = parseInt(request.params.attachmentId, 10)
            const [attachment] = await db
                .select()
                .from(attachments)
                .where(eq(attachments.id, attachmentId))
                .limit(1)
            if (!attachment) {
                return reply.code(404).send({ error: 'Attachment not found'})
            }

            const stream = await minioClient.getObject(BUCKET, attachment.fileKey)
            
            reply.header('Content-Type', attachment.contentType)
            reply.header(
                'Content-Disposition',
                `attachment; filename="${attachment.fileName}"`
            )

            return reply.send(stream)
        }
    )
}