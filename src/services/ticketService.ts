import { supabase, DatabaseTicket, DatabaseTicketUpdate } from '../lib/supabase';
import { Ticket } from '../types';

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

  // Create a new ticket
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
          assignee_id: ticketData.assignee === 'Unassigned' ? null : ticketData.assignee,
          requester_id: ticketData.requester
        }])
        .select()
        .single();

      if (error || !data) throw error;
      return await convertDatabaseTicket(data);
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },

  // Update ticket status
  async updateTicketStatus(ticketNumber: string, status: string, author: string): Promise<boolean> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();
      if (ticketError || !ticketData) throw ticketError;

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketData.id);
      if (updateError) throw updateError;

      await this.addTicketUpdate(ticketNumber, author, `Status changed to ${status}`, 'status_change');
      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  },

  // Assign ticket
  async assignTicket(ticketNumber: string, assigneeId: string, author: string): Promise<boolean> {
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();
      if (ticketError || !ticketData) throw ticketError;

      const assigneeName = await getUserFullName(assigneeId);

      const { error: updateError } = await supabase
        .from('tickets')
        .update({ assignee_id: assigneeId })
        .eq('id', ticketData.id);
      if (updateError) throw updateError;

      await this.addTicketUpdate(ticketNumber, author, `Ticket assigned to ${assigneeName}`, 'assignment');
      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  },

  // Add ticket update/comment
  async addTicketUpdate(ticketNumber: string, author: string, content: string, updateType: string = 'comment'): Promise<boolean> {
    try {
      const { data: ticketData } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .single();
      if (!ticketData) return false;

      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticketData.id,
          technician_id: author, // author user ID
          comment: content
        }]);
      return !error;
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

  // Dashboard stats
  async getDashboardStats() {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status, priority');
      if (error || !tickets) throw error;

      return {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedToday: tickets.filter(t => t.status === 'resolved').length,
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
  }
};
