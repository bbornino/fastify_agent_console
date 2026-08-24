import { useState } from "react"
import { useNavigate } from "react-router"
import { TicketForm } from "@/components/ticket-form"
import { apiClient } from "@/lib/api-client"
import type { UpdateTicketFormValues } from "@/lib/schemas/ticket-schema"

export function CreateTicketPage() {
    const navigate = useNavigate()
    const [serverError, setServerError] = useState<string | null>(null)

    const handleSubmit = async (data: UpdateTicketFormValues) => {
        setServerError(null)
        try {
            const response = await apiClient.post('/tickets', data)
            navigate(`/tickets/${response.data.id}`)
        } catch {
            setServerError('Something went wrong.  Please try again.')
        }
    }

    return (
        <div className="p-4 max-w-3xl mx-auto space-y-4">
            <h1 className="text-2xl font-bold">New Ticket</h1>
            <TicketForm onSubmit={handleSubmit} submitLabel="Create Ticket" serverError={serverError} />
        </div>
    )
}