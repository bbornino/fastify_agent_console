import type { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, tickets } from "@fastify-agent-console/db"

export default async function (fastify: FastifyInstance) {
    fastify.patch<{
        Params: { ticketId: string };
        Body: {
            status?: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
            priority?: 'low' | 'medium' | 'high' | 'urgent'
            assignedAgentId?: number | null;
            category?: string;
            isEscalated?: boolean;
            internalNotes?: string;
        };
    }>(
        '/:ticketId',
        { onRequest: [fastify.authenticate]},
        async (request, reply) => {
            const ticketId = parseInt(request.params.ticketId, 10)
            const [existing] = await db
                .select()
                .from(tickets)
                .where(eq(tickets.id, ticketId))
                .limit(1)

            if (!existing) {
                return reply.code(404).send({ error: 'Ticket no found'})
            }

            const updates: Partial<typeof tickets.$inferInsert> = {
                ...request.body,
                updatedAt: new Date(),
            }

            if (request.body.status === 'resolved' && !existing.resolvedAt) {
                updates.resolvedAt = new Date()
            }

            const [updated] = await db
                .update(tickets)
                .set(updates)
                .where(eq(tickets.id, ticketId))
                .returning()

            reply.send(updated)
        }
    )
}