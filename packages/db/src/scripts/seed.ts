import bcrypt from 'bcrypt'
import { sql } from 'drizzle-orm'
import { db } from '../lib/db'
import { users, tickets } from '../lib/schema'
import {TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from '../lib/constants'

const CUSTOMER_NAMES = [
    'Jane Customer', 'Bob Smith', 'Maria Garcia', 'Tom Lee', 'Sarah Chen',
    'David Kim', 'Priya Patel', 'James Wilson', 'Emma Davis', 'Carlos Ruiz'
]

function randomFrom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

async function seed() {
    console.log('Truncating tables...')

    // Order matters: children before parents, due to foreign keys
    await db.execute(sql`TRUNCATE TABLE attachments RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE tickets RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE refresh_tokens RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`)

    console.log('Seeding agents...')
    const passwordHash = await bcrypt.hash('agentpass123', 10)
    const agentNames = ['Alex Agent', 'Robin Rep', 'Sam Support']
    const agentIds: number[] = []

    for (const name of agentNames) {
        const email = `${name.toLowerCase().replace(' ', '.')}@agentconsole.test`
        const [agent] = await db
            .insert(users)
            .values({
                email, passwordHash, name, role: 'agent', updatedAt: new Date(),
            })
            .onConflictDoNothing()
            .returning()
        if (agent) agentIds.push(agent.id)
    }

    console.log(`Created ${agentIds.length} agents (password: agentpass123)`)
    console.log('Seeding tickets...')

    const ticketSubjects = [
        'Cannot log in to my account',
        'Refund request for my order #4521',
        'Shipping address needs to be updated',
        'App crashes on checkout',
        'Question about subscription pricing',
        'Product arrived damaged',
        'Unable to reset password',
        'Duplicate charge on my card',
        'Feature request: dark mode',
        'Account locked after failed attempts',
        'Tracking number not working',
        'Need invoice for tax purposes',
    ]

    let created = 0
    for (let i = 0; i < 40; i++) {
        const subject = `${randomFrom(ticketSubjects)} (#${i + 1})`
        const status = randomFrom(TICKET_STATUSES)
        const isResolved = status === 'resolved' || status === 'closed'

        await db.insert(tickets).values({
            subject,
            description: `Customer reported: ${subject.toLowerCase()}. Needs follow-up.`,
            status,
            priority: randomFrom(TICKET_PRIORITIES),
            customerEmail: `customer${i}@example.com`,
            customerName: randomFrom(CUSTOMER_NAMES),
            assignedAgentId: Math.random() > 0.2 ? randomFrom(agentIds) : null,
            category: randomFrom(TICKET_CATEGORIES)?? undefined,
            isEscalated: Math.random() > 0.85,
            resolvedAt: isResolved ? new Date() : undefined,
            updatedAt: new Date(),
        })

        created++
    }

    console.log('Seeding a large batch of tickets for pagination testing...');

    const BULK_COUNT = 25000;
    const BATCH_SIZE = 500;
    let bulkCreated = 0;

    for (let batchStart = 0; batchStart < BULK_COUNT; batchStart += BATCH_SIZE) {
        const batch = [];
        const batchEnd = Math.min(batchStart + BATCH_SIZE, BULK_COUNT);

        for (let i = batchStart; i < batchEnd; i++) {
            const subject = `${randomFrom(ticketSubjects)} (#bulk-${i + 1})`;
            const status = randomFrom(TICKET_STATUSES);
            const isResolved = status === 'resolved' || status === 'closed';

            batch.push({
            subject,
            description: `Bulk seed ticket for pagination testing.`,
            status,
            priority: randomFrom(TICKET_PRIORITIES),
            customerEmail: `bulkcustomer${i}@example.com`,
            customerName: randomFrom(CUSTOMER_NAMES),
            assignedAgentId: Math.random() > 0.2 ? randomFrom(agentIds) : null,
            category: randomFrom(TICKET_CATEGORIES) ?? undefined,
            isEscalated: Math.random() > 0.85,
            resolvedAt: isResolved ? new Date() : undefined,
            updatedAt: new Date(),
            });
        }

        await db.insert(tickets).values(batch);
        bulkCreated += batch.length;

        if (bulkCreated % 5000 === 0) {
            console.log(`  ...${bulkCreated} bulk tickets inserted`);
        }
    }

    console.log(`Created ${bulkCreated} bulk tickets`);
    console.log(`Created ${created} tickets`)
    console.log('Seed Complete.')
    process.exit(0)
}

seed().catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
})