import { pgTable, serial, varchar, text, boolean, timestamp, pgEnum, integer, } from 'drizzle-orm/pg-core'

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