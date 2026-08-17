import type { FastifyInstance } from "fastify"
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { db, tickets, attachments, minioClient } from '@fastify-agent-console/db'

const BUCKET = process.env['MINIO_BUCKET'] as string

export default async function (fastify: FastifyInstance) {
    fastify.post<{
        Params: { ticketId: string }
    }>(
        '/:ticketId/attachments',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const ticketId = parseInt(request.params.ticketId, 10)

            const [ticket] = await db
                    .select()
                    .from(tickets)
                    .where(eq(tickets.id, ticketId))
                    .limit(1)

            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found'})
            }

            const file = await request.file()

            if (!file) {
                return reply.code(400).send({ error: 'No file provided'})
            }

            const { userId } = request.user as { userId: number; role: string }

            const fileKey = `${ticketId}/${crypto.randomUUID()}-${file.filename}`
            const buffer = await file.toBuffer()

            await minioClient.putObject(BUCKET, fileKey, buffer, buffer.length, {
                'Content-Type': file.mimetype,
            })

            const [attachment] = await db
                .insert(attachments)
                .values({
                    ticketId,
                    uploadedByUserId: userId,
                    fileName: file.filename,
                    fileKey,
                    contentType: file.mimetype,
                    fileSizeBytes: buffer.length,
                })
                .returning()

            reply.code(201).send(attachment)
        }
    )
}