import type { FastifyInstance } from "fastify"
import { db, tickets } from '@fastify-agent-console/db'
import { broadcastTicketEvent } from "../../lib/ticket-events"

export default async function (fastify: FastifyInstance) {
    fastify.post<{
        Body: {
            subject: string;
            description: string;
            customerEmail: string;
            customerName: string;
            priority?: 'low' | 'medium' | 'high' | 'urgent';
            category?: string;
        };
    }>(
        '/',
        { onRequest: [fastify.authenticate] },
        async (request, reply) => {
            const { subject, description, customerEmail, customerName, priority, category } = request.body;
            const [ticket] = await db
                .insert(tickets)
                .values({subject, description, customerEmail, customerName, 
                    priority: priority ?? 'medium', 
                    category, 
                    updatedAt: new Date(),
                })
                .returning();

            broadcastTicketEvent({ type: 'created', ticketId: ticket.id })
            reply.code(201).send(ticket);
        }
    )
}