import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router"
import { TicketForm } from "@/components/ticket-form"
import { Button } from "@/components/ui/button"
import { apiClient } from '@/lib/api-client'
import type { UpdateTicketFormValues } from "@/lib/schemas/ticket-schema"
import { attachments } from '../../../../packages/db/src/lib/schema';

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

interface Attachment {
    id: number;
    fileName: string;
    fileSizeBytes: number;
    createdAt: string;
}

export function TicketDetailPage() {
    const { ticketId } = useParams()
    const navigate = useNavigate()
    const [ticket, setTicket] = useState<Ticket | null>(null)
    const [agents, setAgents] = useState<Agent[]>([])
    const [attachments, setAttachments] = useState<Attachment[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [serverError, setServerError] = useState<string | null>(null)

    const fetchAttachments = () => {
        apiClient
            .get<Attachment[]>(`/tickets/${ticketId}/attachments`)
            .then((res) => setAttachments(res.data))
    }

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

        fetchAttachments()
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData();
        formData.append('file', file)

        try {
            await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data'},
            })
            fetchAttachments()
        } catch {
            setServerError('File upload failed. Please try again.')
        } finally {
            setUploading(false)
            e.target.value = ''
        }
    }

    const handleDownload = (attachmentId: number, fileName: string) => {
        apiClient
            .get(`/attachments/${attachmentId}/download`, {responseType: 'blob'})
            .then((res) => {
                const url = window.URL.createObjectURL(new Blob([res.data]))
                const link = document.createElement('a')
                link.href = url
                link.download = fileName
                link.click()
                window.URL.revokeObjectURL
            })
    }

    const handleDelete = async (attachmentId: number) => {
        try {
            await apiClient.delete(`/attachments/${attachmentId}`)
            fetchAttachments()
        } catch {
            setServerError('Failed to delete attachment.  Please try again.')
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

            <div className="space-y-2 border-t pt-4">
                <h2 className="text-lg font-semibold">Attachments</h2>

                {attachments.length === 0 && (
                    <p className="text-sm text-muted-foreground">No attachments yet.</p>
                )}

                <ul className="space-y-1">
                    {attachments.map((attachment) => (
                        <li key={attachment.id} className="flex items-center justify-between text-sm">
                            <span>
                                {attachment.fileName}{' '}
                                <span className="text-muted-foreground">
                                    ({Math.round(attachment.fileSizeBytes / 1024)} KB)
                                </span>
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(attachment.id, attachment.fileName)}
                            >
                                Download
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(attachment.id)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>

                <div className="pt-2">
                    <label htmlFor="file-upload" className="text-sm font-medium block mb-1">
                        Upload a file
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="file-input-styled"
                    />
                    {uploading && <p className="text-sm text-muted-foreground mt-1">Uploading...</p>}
                </div>
            </div>
        </div>
    )
}