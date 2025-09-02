import { supabase, DatabaseTicket, DatabaseTicketUpdate } from '../lib/supabase';
import { Ticket } from '../types';

// Convert database ticket to app ticket format
const convertDatabaseTicket = (dbTicket: DatabaseTicket): Ticket => ({
  id: dbTicket.ticket_number,
  title: dbTicket.title,
  description: dbTicket.description,
  type: dbTicket.type,
  priority: dbTicket.priority,
  status: dbTicket.status,
  assignee: dbTicket.assignee || 'Unassigned',
  requester: dbTicket.requester,
  category: dbTicket.category,
  subcategory: dbTicket.subcategory,
  createdAt: new Date(dbTicket.created_at),
  updatedAt: new Date(dbTicket.updated_at)
});

export const ticketService = {
  // Fetch all tickets
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(convertDatabaseTicket) || [];
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return [];
    }
  },

  // Create a new ticket
  async createTicket(ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>): Promise<Ticket | null> {
    try {
      // Generate ticket number
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
          subcategory: ticketData.subcategory,
          assignee: ticketData.assignee === 'Unassigned' ? null : ticketData.assignee,
          requester: ticketData.requester
        }])
        .select()
        .single();

      if (error) throw error;

      return data ? convertDatabaseTicket(data) : null;
    } catch (error) {
      console.error('Error creating ticket:', error);
      return null;
    }
  },

  // Update ticket status
  async updateTicketStatus(ticketId: string, status: string, author: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status })
        .eq('ticket_number', ticketId);

      if (updateError) throw updateError;

      // Add update record
      await this.addTicketUpdate(ticketId, author, `Status changed to ${status}`, 'status_change');

      return true;
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return false;
    }
  },

  // Assign ticket
  async assignTicket(ticketId: string, assignee: string, author: string): Promise<boolean> {
    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ assignee })
        .eq('ticket_number', ticketId);

      if (updateError) throw updateError;

      // Add update record
      await this.addTicketUpdate(ticketId, author, `Ticket assigned to ${assignee}`, 'assignment');

      return true;
    } catch (error) {
      console.error('Error assigning ticket:', error);
      return false;
    }
  },

  // Add ticket update/comment
  async addTicketUpdate(ticketId: string, author: string, content: string, updateType: string = 'comment'): Promise<boolean> {
    try {
      // Get the actual ticket UUID from ticket_number
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketId)
        .single();

      if (ticketError || !ticketData) throw ticketError;

      const { error } = await supabase
        .from('ticket_updates')
        .insert([{
          ticket_id: ticketData.id,
          author,
          content,
          update_type: updateType
        }]);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error adding ticket update:', error);
      return false;
    }
  },

  // Get ticket updates
  async getTicketUpdates(ticketId: string): Promise<DatabaseTicketUpdate[]> {
    try {
      // Get the actual ticket UUID from ticket_number
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('ticket_number', ticketId)
        .single();

      if (ticketError || !ticketData) throw ticketError;

      const { data, error } = await supabase
        .from('ticket_updates')
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

  // Get dashboard stats
  async getDashboardStats() {
    try {
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('status, priority');

      if (error) throw error;

      const stats = {
        totalTickets: tickets?.length || 0,
        openTickets: tickets?.filter(t => t.status === 'open').length || 0,
        inProgressTickets: tickets?.filter(t => t.status === 'in_progress').length || 0,
        resolvedToday: tickets?.filter(t => t.status === 'resolved').length || 0,
        criticalTickets: tickets?.filter(t => t.priority === 'critical').length || 0
      };

      return stats;
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