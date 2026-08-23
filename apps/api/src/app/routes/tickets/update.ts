import type { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, tickets, users } from "@fastify-agent-console/db"
import { sendTicketAssignedEmail, sendTicketResolvedEmail } from '@fastify-agent-console/mail'
import { broadcastTicketEvent } from "../../lib/ticket-events"

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

            const justResolved = request.body.status === 'resolved' && !existing.resolvedAt

            if (justResolved) {
                updates.resolvedAt = new Date()
            }

            const wasReassigned =
                request.body.assignedAgentId !== undefined &&
                request.body.assignedAgentId !== null &&
                request.body.assignedAgentId !== existing.assignedAgentId

            const [updated] = await db
                .update(tickets)
                .set(updates)
                .where(eq(tickets.id, ticketId))
                .returning()

            if (wasReassigned) {
                const [agent] = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, updated.assignedAgentId as number))
                    .limit(1)

                if (agent) {
                    sendTicketAssignedEmail({
                        agentEmail: agent.email,
                        agentName: agent.name,
                        ticketId: updated.id,
                        ticketSubject: updated.subject,
                    }).catch((err) => fastify.log.error(err, 'Failed to send ticket-assigned email'))
                }
            }
                
            if (justResolved) {
                fastify.log.info('DEBUG: about to send resolved email')

                sendTicketResolvedEmail({
                    customerEmail: updated.customerEmail,
                    customerName: updated.customerName,
                    ticketId: updated.id,
                    ticketSubject: updated.subject,
                }).catch((err) => fastify.log.error(err, 'Failed to send ticket-resolved email'))
            }

            broadcastTicketEvent({ type: 'updated', ticketId: updated.id })
            reply.send(updated)

        }
    )
}