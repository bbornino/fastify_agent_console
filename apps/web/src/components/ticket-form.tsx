import { useForm, Controller, type DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select'
import { updateTicketSchema, type UpdateTicketFormValues } from "@/lib/schemas/ticket-schema"
import { TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES } from "../../../../packages/db/src/lib/constants"

interface TicketFormProps {
    defaultValues?: DefaultValues<UpdateTicketFormValues>;
    onSubmit: (data: UpdateTicketFormValues) => Promise<void>;
    submitLabel: string;
    showStatusFields?: boolean;
    agents?: {id: number; name: string }[]
    serverError?: string | null
}

export function TicketForm({
    defaultValues,
    onSubmit,
    submitLabel,
    showStatusFields = false,
    agents = [],
    serverError,
}: TicketFormProps) {
    const { register, handleSubmit, control, formState: {errors, isSubmitting },
    } = useForm<UpdateTicketFormValues>({
        resolver: zodResolver(updateTicketSchema),
        defaultValues,
    })

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Row 1: Customer Name, Customer Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input id="customerName" {...register('customerName')} />
                    {errors.customerName && (<p className="text-sm text-destructive">{errors.customerName.message}</p>)}
                </div>
                    <div className="space-y-1">
                    <Label htmlFor="customerEmail">Customer Email</Label>
                    <Input id="customerEmail" {...register('customerEmail')} />
                    {errors.customerEmail && (<p className="text-sm text-destructive">{errors.customerEmail.message}</p>)}
                </div>
            </div>

            {/* Row 2: Priority, Category, Status, Assigned Agent  */}
            <div className={`grid grid-cols-1 gap-4 ${showStatusFields ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
                <div className="space-y-1">
                    <Label>Priority</Label>
                    <Controller
                        name="priority"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TICKET_PRIORITIES.map((priority) => (
                                        <SelectItem key={priority} value={priority}>
                                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>
                <div className="space-y-1">
                    <Label>Category</Label>
                    <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TICKET_CATEGORIES.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </div>

                {showStatusFields && (
                    <>
                        <div className="space-y-1">
                            <Label>Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TICKET_STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Assigned Agent</Label>
                            <Controller
                                name="assignedAgentId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={(val) => field.onChange(val ? parseInt(val, 10) : null)} 
                                            value={field.value?.toString() ?? ''}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unassigned" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {agents.map((agent) => (
                                                <SelectItem key={agent.id} value={agent.id.toString()}>
                                                    {agent.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                    </>
                )}

            </div>

            {/* Row 3: Subject, full width */}
            <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" {...register('subject')} />
                {errors.subject && (<p className="text-sm text-destructive">{errors.subject.message}</p>)}
            </div>

            <div className="space-y-1">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" className="min-h-32" {...register('description')} />
                {errors.description && (<p className="text-sm text-destructive">{errors.description.message}</p>)}
            </div>
            
            {serverError && <p className="text-sm text-desctructive">{serverError}</p>}

            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : submitLabel}
            </Button>
        </form>
    )
}