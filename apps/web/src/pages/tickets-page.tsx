import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api-client'

interface Ticket {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string;
    customerEmail: string;
    customerName: string;
    careatedAt: string;
}

export function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiClient
            .get('/tickets')
            .then((res) => setTickets(res.data))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className='p-4'>Loading Tickets...</div>

    return (
        <div className='p-4 space-y-4'>
            <h1 className='text-2xl font-bold'>Tickets</h1>
            <div className='space-y-2'>
                {tickets.map((ticket) => (
                    <div key={ticket.id} className='border rounded-md p-3'>
                        <div className='flex justify-between items-start'>
                            <h2 className='font-semibold'>{ticket.subject}</h2>
                            <span className='text-xs uppercase text-muted-foreground'>
                                {ticket.status} · {ticket.priority}
                            </span>
                        </div>
                        <p className='text-sm text-muted-foreground'>{ticket.description}</p>
                        <p className='text-xs text-muted-foreground mt-1'>
                            {ticket.customerName} ({ticket.customerEmail})
                        </p>
                    </div>
                ))}
            </div>
        </div>
    )
}