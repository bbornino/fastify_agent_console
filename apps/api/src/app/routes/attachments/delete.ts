import type { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, attachments, minioClient } from '@fastify-agent-console/db'

const BUCKET = process.env['MINIO_BUCKET'] as string

export default async function (fastify: FastifyInstance) {
    fastify.delete<{
        Params: {attachmentId: string }
    }>(
        '/:attachmentId',
        { onRequest: [fastify.authenticate] },
        async (request, reply ) => {
            const attachmentId = parseInt(request.params.attachmentId, 10)

            const [attachment] = await db
                .select()
                .from(attachments)
                .where(eq(attachments.id, attachmentId))
                .limit(1)

            if (!attachment) {
                return reply.code(404).send({ error: 'Attachment not found' })
            }

            await minioClient.removeObject(BUCKET, attachment.fileKey)
            await db.delete(attachments).where(eq(attachments.id, attachmentId))

            reply.code(204).send()
        }
    )
}