import { mailTransport } from "./mail-client";

export async function sendTicketAssignedEmail(params: {
    agentEmail: string;
    agentName: string;
    ticketId: number;
    ticketSubject: string;
}) {
    await mailTransport.sendMail({
        from: '"Agent Console" <no-reply@agentconsole.test>',
        to: params.agentEmail,
        subject: `Ticket #${params.ticketId} assigned to you`,
        text: `Hi ${params.agentName}, \n\nTicket #${params.ticketId} ("${params.ticketSubject}") has been asigned to you.\n\nPlease review it in the agent console.`,
    })
}

export async function sendTicketResolvedEmail(params: {
    customerEmail: string;
    customerName: string;
    ticketId: number;
    ticketSubject: string;
}) {
    await mailTransport.sendMail({
        from: '"Support Team" <no-reply@agentconsole.test>',
        to: params.customerEmail,
        subject: `Your ticket #${params.ticketId} has been resolved`,
        text: `Hi ${params.customerName},\n\nYour support ticket ("${params.ticketSubject}) has been marked as resolved.\n\nIf you have further questions, please open a new ticket.`,
    })
}