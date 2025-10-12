import { supabase, DatabaseTicket, DatabaseTicketUpdate } from '../lib/supabase';
import { Ticket } from '../types';
import { notificationService } from './notificationService';

// Helper: Fetch full name for a user ID
const getUserFullName = async (userId: string | null): Promise<string> => {
  if (!userId) return 'Unassigned';
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();
  if (error || !data) return 'Unknown';
  return data.full_name;
};

// Helper: Get user profile by ID
const getUserProfile = async (userId: string | null) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data;
};

// Convert database ticket to app ticket format, including full names
const convertDatabaseTicket = async (dbTicket: DatabaseTicket): Promise<Ticket> => {
  const requesterName = await getUserFullName(dbTicket.requester_id);
  const assigneeName = await getUserFullName(dbTicket.assignee_id);

  return {
    id: dbTicket.ticket_number,
    title: dbTicket.title,
    description: dbTicket.description,
    type: dbTicket.type as any,
    priority: dbTicket.priority as any,
    status: dbTicket.status as any,
    category: dbTicket.category,
    requester: requesterName,
    assignee: assigneeName,
    requester_id: dbTicket.requester_id,
    assignee_id: dbTicket.assignee_id,
    createdAt: new Date(dbTicket.created_at),
    updatedAt: new Date(dbTicket.updated_at),
  };
};

export const ticketService = {
  // Fetch all tickets with requester and assignee full names
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) throw error;

      return await Promise.all(data.map(convertDatabaseTicket));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },

  // Create a new ticket with notifications
  async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket | null> {
    try {
      const prefix = ticketData.type === 'incident' ? 'INC' : 'SR';
      const timestamp = Date.now().toString().slice(-6);
      const ticketNumber = `${prefix}-${timestamp}`;

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          ticket_number: ticketNumber,
          title: ticketData.title,
          description: ticketData.description,
          type: ticketData.type,
          priority: ticketData.priority,
          status: ticketData.status,
          category: ticketData.category,
          assignee_id: ticketData.assignee_id || null,
          requester_id: ticketData.requester_id
        }])
        .select()
        .single();

      if (error || !data) throw error;

      // Trigger notification for ticket creation
      await notificationService.notifyTicketCreated({
        id: data.id,
        title: data.title,
        requester: data.requester_id,
        assignee_id: data.assignee_id,
        priority: data.priority
      });

      return await convertDatabaseTicket(data);
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },

  // Update ticket status with notifications
  async updateTicketStatus(ticketNumber: string, status: string, author: string): Promise<boolean> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();
      
      if (ticketError || !ticketData) throw ticketError;

      const previousStatus = ticketData.status;
      const previousAssignee = ticketData.assignee_id;

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketData.id);
      
      if (updateError) throw updateError;

      // Add ticket update record
      await this.addTicketUpdate(ticketNumber, author, `Status changed from ${previousStatus} to ${status}`, 'status_change');

      // Trigger notification for status update
      await notificationService.notifyTicketUpdated({
        id: ticketData.id,
        title: ticketData.title,
        requester: ticketData.requester_id,
        assignee_id: ticketData.assignee_id,
        previous_assignee: previousAssignee,
        status: status,
        updated_by: author
      });

      // Special notification for resolved tickets
      if (status === 'resolved') {
        await notificationService.notifyTicketResolved({
          id: ticketData.id,
          title: ticketData.title,
          requester: ticketData.requester_id,
          resolved_by: author
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  },

  // Assign ticket with notifications
  async assignTicket(ticketNumber: string, assigneeId: string, author: string): Promise<boolean> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();
      
      if (ticketError || !ticketData) throw ticketError;

      const previousAssignee = ticketData.assignee_id;
      const assigneeName = await getUserFullName(assigneeId);

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          assignee_id: assigneeId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketData.id);
      
      if (updateError) throw updateError;

      // Add ticket update record
      await this.addTicketUpdate(ticketNumber, author, `Ticket assigned to ${assigneeName}`, 'assignment');

      // Trigger notification for assignment
      await notificationService.notifyTicketUpdated({
        id: ticketData.id,
        title: ticketData.title,
        requester: ticketData.requester_id,
        assignee_id: assigneeId,
        previous_assignee: previousAssignee,
        status: ticketData.status,
        updated_by: author
      });

      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  },

  // Update ticket with comprehensive notifications
  async updateTicket(ticketNumber: string, updates: any, author: string): Promise<boolean> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();
      
      if (ticketError || !ticketData) throw ticketError;

      const previousAssignee = ticketData.assignee_id;
      const previousStatus = ticketData.status;
      const previousPriority = ticketData.priority;

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketData.id);
      
      if (updateError) throw updateError;

      // Track what changed for the update message
      const changes = [];
      if (updates.status && updates.status !== previousStatus) {
        changes.push(`status to ${updates.status}`);
      }
      if (updates.priority && updates.priority !== previousPriority) {
        changes.push(`priority to ${updates.priority}`);
      }
      if (updates.assignee_id && updates.assignee_id !== previousAssignee) {
        const assigneeName = await getUserFullName(updates.assignee_id);
        changes.push(`assignee to ${assigneeName}`);
      }

      if (changes.length > 0) {
        await this.addTicketUpdate(ticketNumber, author, `Updated ${changes.join(', ')}`, 'update');

        // Trigger notification for general update
        await notificationService.notifyTicketUpdated({
          id: ticketData.id,
          title: ticketData.title,
          requester: ticketData.requester_id,
          assignee_id: updates.assignee_id || ticketData.assignee_id,
          previous_assignee: previousAssignee,
          status: updates.status || ticketData.status,
          updated_by: author
        });
      }

      return true;
    } catch (error) {
      console.error('Error updating ticket:', error);
      return false;
    }
  },

  // Add ticket update/comment with notifications
  async addTicketUpdate(ticketNumber: string, author: string, content: string, updateType: string = 'comment'): Promise<boolean> {
    try {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();
      
      if (!ticketData) return false;

      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticketData.id,
          technician_id: author,
          comment: content,
          update_type: updateType
        }]);

      if (error) throw error;

      // Trigger notification for comments (only if it's an actual comment, not system update)
      if (updateType === 'comment') {
        const authorProfile = await getUserProfile(author);
        const commentText = content.length > 100 ? content.substring(0, 100) + '...' : content;

        await notificationService.notifyCommentAdded({
          ticket_id: ticketData.id,
          ticket_title: ticketData.title,
          comment_by: author,
          comment_text: commentText,
          ticket_requester: ticketData.requester_id,
          ticket_assignee: ticketData.assignee_id
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding ticket update:', error);
      return false;
    }
  },

  // Get ticket updates
  async getTicketUpdates(ticketNumber: string): Promise<DatabaseTicketUpdate[]> {
    try {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();
      if (!ticketData) return [];

      const { data, error } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', ticketData.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching ticket updates:', error);
      return [];
    }
  },

  // Get ticket by ID with full details
  async getTicketById(ticketNumber: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single();
      
      if (error || !data) throw error;
      return await convertDatabaseTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  },

  // Dashboard stats
  async getDashboardStats() {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status, priority, created_at');
      
      if (error || !tickets) throw error;

      // Calculate resolved today
      const today = new Date().toISOString().split('T')[0];
      const resolvedToday = tickets.filter(t => {
        const resolvedDate = new Date(t.created_at).toISOString().split('T')[0];
        return t.status === 'resolved' && resolvedDate === today;
      }).length;

      return {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedToday: resolvedToday,
        criticalTickets: tickets.filter(t => t.priority === 'critical').length
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedToday: 0,
        criticalTickets: 0
      };
    }
  },

  // Get tickets by user ID
  async getTicketsByUserId(userId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .or(`requester_id.eq.${userId},assignee_id.eq.${userId}`)
        .order('created_at', { ascending: false });
      
      if (error || !data) throw error;
      return await Promise.all(data.map(convertDatabaseTicket));
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
  },

  // Get assigned tickets for technician
  async getAssignedTickets(technicianId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assignee_id', technicianId)
        .order('created_at', { ascending: false });
      
      if (error || !data) throw error;
      return await Promise.all(data.map(convertDatabaseTicket));
    } catch (error) {
      console.error('Error fetching assigned tickets:', error);
      return [];
    }
  },

  // Get unassigned tickets
  async getUnassignedTickets(): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .is('assignee_id', null)
        .order('created_at', { ascending: false });
      
      if (error || !data) throw error;
      return await Promise.all(data.map(convertDatabaseTicket));
    } catch (error) {
      console.error('Error fetching unassigned tickets:', error);
      return [];
    }
  }
};