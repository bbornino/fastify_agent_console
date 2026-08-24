import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'

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

interface TicketsResponse {
    tickets: Ticket[];
    nextCursor: number | null;
}

export function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [cursor, setCursor] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const accessToken = useAuthStore((state) => state.accessToken)

    const fetchFirstPage = () => {
        apiClient.get<TicketsResponse>('/tickets').then((res) => {
            setTickets(res.data.tickets)
            setCursor(res.data.nextCursor)
        })
    }

    const loadMore = async () => {
        if (cursor === null) return
        setLoadingMore(true)
        try {
            const res = await apiClient.get<TicketsResponse>(`/tickets?cursor=${cursor}`)
            setTickets((prev) => [...prev, ...res.data.tickets])
            setCursor(res.data.nextCursor)
        } finally {
            setLoadingMore(false)
        }
    }
    useEffect(() => {
        fetchFirstPage()
        setLoading(false)
    }, [])

    useEffect(() => {
        if (!accessToken) return

        const eventSource = new EventSource(`/api/tickets/events?token=${accessToken}`)

        eventSource.onmessage = () => {
            fetchFirstPage()
        }

        return () => {
            eventSource.close()
        }
    }, [accessToken])

    if (loading) return <div className='p-4'>Loading Tickets...</div>

    return (
        <div className='p-4 space-y-4'>
            <h1 className='text-2xl font-bold'>Tickets</h1>
            <div className='space-y-2'>
                {tickets.map((ticket) => (
                    <Link key={ticket.id} to={`/tickets/${ticket.id}`} className='block'>
                        <div className='border rounded-md p-3'>
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
                    </Link>
                ))}
            </div>

            {cursor !== null && (
                <Button onClick={loadMore} disabled={loadingMore} variant="outline" className='w-full'>
                    {loadingMore ? 'Loading...' : 'Load more'}
                </Button>
            )}
        </div>
    )
}