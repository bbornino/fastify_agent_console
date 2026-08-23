import { pgTable, serial, varchar, text, boolean, timestamp, pgEnum, integer, } from 'drizzle-orm/pg-core'
import { TICKET_STATUSES, TICKET_PRIORITIES } from './constants'

export const userRoleEnum = pgEnum('user_role', ['agent', 'admin'])

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 255}).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255}),
    googleId: varchar('google_id', {length: 255}).unique(),
    name: varchar('name', {length: 255}).notNull(),
    avatarUrl: text('avatar_url'),
    role: userRoleEnum('role').notNull().default('agent'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    tokenHash: varchar('token_hash', {length: 255}).notNull().unique(),
    expiresAt: timestamp('expires_at', {withTimezone: true}).notNull(),
    revokedAt: timestamp('revoked_at', {withTimezone: true}),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
})

export const ticketStatusEnum = pgEnum('ticket_status', TICKET_STATUSES)
export const ticketPriorityEnum = pgEnum('ticket_priority', TICKET_PRIORITIES)

export const tickets = pgTable('tickets', {
    id: serial('id').primaryKey(),
    subject: varchar('subject', { length: 255}).notNull(),
    description: text('description').notNull(),
    status: ticketStatusEnum('status').notNull().default('new'),
    priority: ticketPriorityEnum('priority').notNull().default('medium'),
    customerEmail: varchar('customer_email', { length: 255}).notNull(),
    customerName: varchar('customer_name', { length: 255}).notNull(),
    assignedAgentId: integer('assigned_agent_id').references(() => users.id),
    category: varchar('category', { length: 100}),
    isEscalated: boolean('is_escalated').notNull().default(false),
    firstResponseAt: timestamp('first_response_at', { withTimezone: true}),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    dueBy: timestamp('due_by', { withTimezone: true }),
    satisfactionRating: integer('satisfaction_rating'),
    internalNotes: text('internal_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
})

export const attachments = pgTable('attachments', {
    id: serial('id').primaryKey(),
    ticketId: integer('ticket_id').notNull().references(() => tickets.id),
    uploadedByUserId: integer('uploaded_by_user_id').notNull().references(() => users.id),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    fileKey: varchar('file_key', { length: 500 }).notNull().unique(),
    contentType: varchar('content_type', { length: 100 }).notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})