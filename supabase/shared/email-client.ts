// supabase/functions/shared/email-client.ts
import { Resend } from "npm:resend@2.0.0"

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export class EmailClient {
  private resend: Resend

  constructor() {
    this.resend = new Resend(Deno.env.get('RESEND_API_KEY'))
  }

  async sendEmail(options: EmailOptions) {
    const { data, error } = await this.resend.emails.send({
      from: options.from || 'support@yourdomain.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    if (error) {
      throw new Error(`Email failed: ${error.message}`)
    }

    return data
  }
}

// Email templates
export const EmailTemplates = {
  ticketCreated: (ticket: any) => ({
    subject: `Ticket Created: ${ticket.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2563eb;">Your Ticket Has Been Created</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Title:</strong> ${ticket.title}</p>
          <p><strong>Description:</strong> ${ticket.description}</p>
          <p><strong>Status:</strong> <span style="color: #059669;">${ticket.status}</span></p>
          <p><strong>Created:</strong> ${new Date(ticket.created_at).toLocaleDateString()}</p>
        </div>
        <p style="margin-top: 20px;">We'll get back to you as soon as possible.</p>
      </div>
    `
  }),

  userInvite: (user: any) => ({
    subject: 'You have been invited!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #7c3aed;">Welcome to Our Platform!</h2>
        <p>You've been invited to join our platform.</p>
        <a href="${user.invite_link}" 
           style="background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
    `
  })
}