import { z as zod } from 'zod'
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '../../../../../packages/db/src/lib/constants';

export const createTicketSchema = zod.object({
    subject: zod.string().min(1, 'Subject is required').max(255),
    description: zod.string().min(1, 'Description is required'),
    customerEmail: zod.string().email('Enter a valid email address'),
    customerName: zod.string().min(1, 'Customer name is required'),
    priority: zod.enum(TICKET_PRIORITIES).optional(),
    category: zod.enum(TICKET_CATEGORIES).optional(),
})

export type CreateTicketFormValues = zod.infer<typeof createTicketSchema>

export const updateTicketSchema = createTicketSchema.partial().extend({
    status: zod.enum(TICKET_STATUSES).optional(),
    assignedAgentId: zod.number().nullable().optional(),
})

export type UpdateTicketFormValues = zod.infer<typeof updateTicketSchema>