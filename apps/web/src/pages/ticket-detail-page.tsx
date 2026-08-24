import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { TicketForm } from "@/components/ticket-form"
import { apiClient } from '@/lib/api-client'
import type { UpdateTicketFormValues } from "@/lib/schemas/ticket-schema"

interface Ticket {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string;
    customerEmail: string;
    customerName: string;
    category: string | null;
    assignedAgentId: number | null;
}

interface Agent {
    id: number;
    name: string;
}

export function TicketDetailPage() {
    const { ticketId } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        Promise.all([
            apiClient.get<Ticket>(`/tickets/${ticketId}`),
            apiClient.get<Agent[]>('/agents'),
        ])
            .then(([ticketRes, agentsRes]) => {
                setTicket(ticketRes.data)
                setAgents(agentsRes.data)
            })
            .finally(() => setLoading(false))
    }, [ticketId])

    const handleSubmit = async (data: UpdateTicketFormValues) => {
        setServerError(null)
        try {
            await apiClient.patch(`/tickets/${ticketId}`, data)
            navigate('/tickets')
        } catch {
            setServerError('Something went wrong.  Please try again.')
        }
    }

    if (loading) return <div className="p-4">Loading ticket...</div>
    if (!ticket) return <div className="p-4">Ticket not found.</div>

    return (
        <div className="p-4 max-w-3xl mx-auto space-y-4">
            <button onClick={() => navigate('/tickets')} className="text-sm underline text-muted-foreground">
                ← Back to tickets
            </button>
            <h1 className="text-2xl font-bold">Ticket #{ticket.id}</h1>
            <TicketForm
                defaultValues={{
                    subject: ticket.subject,
                    description: ticket.description,
                    customerEmail: ticket.customerEmail,
                    customerName: ticket.customerName,
                    priority: ticket.priority as UpdateTicketFormValues['priority'],
                    category: ticket.category as UpdateTicketFormValues['category'],
                    status: ticket.status as UpdateTicketFormValues['status'],
                    assignedAgentId: ticket.assignedAgentId,
                }}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
                showStatusFields
                agents={agents}
                serverError={serverError}
            />
        </div>
    )
}