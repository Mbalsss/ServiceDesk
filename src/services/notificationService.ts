import { supabase } from '../lib/supabase';

export interface NotificationData {
  recipient_id: string;
  message: string;
  notification_type: 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'ticket_resolved' | 'comment_added' | 'system';
  ticket_id?: string;
  related_user_id?: string;
}

class NotificationService {
  // Create a new notification
  async createNotification(notificationData: NotificationData) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          created_at: new Date().toISOString(),
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      console.log('✅ Notification created:', data);
      return data;
    } catch (error) {
      console.error('Unexpected error creating notification:', error);
      return null;
    }
  }

  // Notify when a ticket is created
  async notifyTicketCreated(ticketData: {
    id: string;
    title: string;
    requester: string;
    assignee_id?: string | null;
    priority: string;
  }) {
    const messages = {
      requester: `Your ticket "${ticketData.title}" has been created and is being reviewed.`,
      assignee: ticketData.assignee_id 
        ? `You have been assigned a new ticket: "${ticketData.title}" (Priority: ${ticketData.priority})`
        : `A new ticket "${ticketData.title}" requires assignment.`,
      admin: `New ticket created: "${ticketData.title}" (Priority: ${ticketData.priority})`
    };

    const notifications: NotificationData[] = [];

    // Notify the requester
    notifications.push({
      recipient_id: ticketData.requester,
      message: messages.requester,
      notification_type: 'ticket_created',
      ticket_id: ticketData.id
    });

    // Notify assignee if exists
    if (ticketData.assignee_id) {
      notifications.push({
        recipient_id: ticketData.assignee_id,
        message: messages.assignee,
        notification_type: 'ticket_assigned',
        ticket_id: ticketData.id
      });
    }

    // Notify admins (you'll need to fetch admin users)
    try {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        admins.forEach(admin => {
          if (admin.id !== ticketData.requester) {
            notifications.push({
              recipient_id: admin.id,
              message: messages.admin,
              notification_type: 'ticket_created',
              ticket_id: ticketData.id
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
    }

    // Create all notifications
    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  // Notify when a ticket is updated
  async notifyTicketUpdated(ticketData: {
    id: string;
    title: string;
    requester: string;
    assignee_id?: string | null;
    previous_assignee?: string | null;
    status: string;
    updated_by: string;
  }) {
    const messages = {
      requester: `Your ticket "${ticketData.title}" has been updated. Status: ${ticketData.status}`,
      new_assignee: ticketData.assignee_id && ticketData.assignee_id !== ticketData.previous_assignee
        ? `You have been assigned to ticket: "${ticketData.title}"`
        : null,
      previous_assignee: ticketData.previous_assignee && ticketData.assignee_id !== ticketData.previous_assignee
        ? `You have been unassigned from ticket: "${ticketData.title}"`
        : null,
      current_assignee: ticketData.assignee_id && ticketData.assignee_id === ticketData.previous_assignee
        ? `Ticket "${ticketData.title}" has been updated. Status: ${ticketData.status}`
        : null
    };

    const notifications: NotificationData[] = [];

    // Notify requester (unless they made the update)
    if (ticketData.requester !== ticketData.updated_by) {
      notifications.push({
        recipient_id: ticketData.requester,
        message: messages.requester,
        notification_type: 'ticket_updated',
        ticket_id: ticketData.id,
        related_user_id: ticketData.updated_by
      });
    }

    // Notify new assignee if changed
    if (messages.new_assignee && ticketData.assignee_id && ticketData.assignee_id !== ticketData.updated_by) {
      notifications.push({
        recipient_id: ticketData.assignee_id,
        message: messages.new_assignee,
        notification_type: 'ticket_assigned',
        ticket_id: ticketData.id,
        related_user_id: ticketData.updated_by
      });
    }

    // Notify previous assignee if removed
    if (messages.previous_assignee && ticketData.previous_assignee && ticketData.previous_assignee !== ticketData.updated_by) {
      notifications.push({
        recipient_id: ticketData.previous_assignee,
        message: messages.previous_assignee,
        notification_type: 'ticket_updated',
        ticket_id: ticketData.id,
        related_user_id: ticketData.updated_by
      });
    }

    // Notify current assignee if no change
    if (messages.current_assignee && ticketData.assignee_id && ticketData.assignee_id !== ticketData.updated_by) {
      notifications.push({
        recipient_id: ticketData.assignee_id,
        message: messages.current_assignee,
        notification_type: 'ticket_updated',
        ticket_id: ticketData.id,
        related_user_id: ticketData.updated_by
      });
    }

    // Create all notifications
    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  // Notify when a comment is added
  async notifyCommentAdded(commentData: {
    ticket_id: string;
    ticket_title: string;
    comment_by: string;
    comment_text: string;
    ticket_requester: string;
    ticket_assignee?: string | null;
  }) {
    const messages = {
      requester: `New comment on your ticket "${commentData.ticket_title}": ${commentData.comment_text.substring(0, 100)}...`,
      assignee: `New comment on ticket "${commentData.ticket_title}": ${commentData.comment_text.substring(0, 100)}...`,
      other: `New comment added to ticket "${commentData.ticket_title}"`
    };

    const notifications: NotificationData[] = [];
    const involvedUsers = new Set<string>();

    // Add requester and assignee
    involvedUsers.add(commentData.ticket_requester);
    if (commentData.ticket_assignee) {
      involvedUsers.add(commentData.ticket_assignee);
    }

    // Notify all involved users except the comment author
    involvedUsers.forEach(userId => {
      if (userId !== commentData.comment_by) {
        let message = messages.other;
        if (userId === commentData.ticket_requester) {
          message = messages.requester;
        } else if (userId === commentData.ticket_assignee) {
          message = messages.assignee;
        }

        notifications.push({
          recipient_id: userId,
          message: message,
          notification_type: 'comment_added',
          ticket_id: commentData.ticket_id,
          related_user_id: commentData.comment_by
        });
      }
    });

    // Create all notifications
    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }

  // Notify when ticket is resolved
  async notifyTicketResolved(ticketData: {
    id: string;
    title: string;
    requester: string;
    resolved_by: string;
  }) {
    const messages = {
      requester: `Your ticket "${ticketData.title}" has been resolved!`,
      resolver: `You resolved ticket "${ticketData.title}"`
    };

    const notifications: NotificationData[] = [];

    // Notify requester
    if (ticketData.requester !== ticketData.resolved_by) {
      notifications.push({
        recipient_id: ticketData.requester,
        message: messages.requester,
        notification_type: 'ticket_resolved',
        ticket_id: ticketData.id,
        related_user_id: ticketData.resolved_by
      });
    }

    // Notify resolver (as confirmation)
    notifications.push({
      recipient_id: ticketData.resolved_by,
      message: messages.resolver,
      notification_type: 'ticket_resolved',
      ticket_id: ticketData.id
    });

    // Create all notifications
    for (const notification of notifications) {
      await this.createNotification(notification);
    }
  }
}

export const notificationService = new NotificationService();