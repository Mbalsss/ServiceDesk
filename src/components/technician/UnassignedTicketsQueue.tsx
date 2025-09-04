import React, { useState, useEffect } from 'react';
import { Ticket, Plus, RefreshCw, Clock, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UnassignedTicketsQueueProps {
  currentUser: { id: string; name: string };
  onTicketTaken: () => void;
  onViewTicket: (ticket: any) => void;
}

interface TicketType {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  category: string;
  status: string;
  requester_id: string;
  assignee_id: string | null;
  requester_name?: string;
  created_at: string;
  estimatedTime?: string;
  sla_deadline?: string;
  image_url?: string;
}

const UnassignedTicketsQueue: React.FC<UnassignedTicketsQueueProps> = ({
  currentUser,
  onTicketTaken,
  onViewTicket,
}) => {
  const [unassignedTickets, setUnassignedTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnassignedTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .is('assignee_id', null)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;
      if (!ticketsData || ticketsData.length === 0) {
        setUnassignedTickets([]);
        setLoading(false);
        return;
      }

      const requesterIds = [...new Set(ticketsData.map(t => t.requester_id).filter(Boolean))];
      let usersMap = new Map();
      if (requesterIds.length > 0) {
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', requesterIds);

        usersData?.forEach(user => usersMap.set(user.id, user.full_name));
      }

      const transformedTickets: TicketType[] = ticketsData.map(ticket => ({
        ...ticket,
        requester_name: usersMap.get(ticket.requester_id) || 'Unknown',
        estimatedTime: ticket.estimatedTime || '2 hours',
      }));

      setUnassignedTickets(transformedTickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load unassigned tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassignedTickets();
  }, []);

  const handleTakeTicket = async (ticketId: string) => {
    console.log('Take ticket clicked for:', ticketId);
    console.log('Current user:', currentUser);
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ 
          status: 'in_progress', 
          assignee_id: currentUser.id, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', ticketId)
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Ticket updated successfully:', data);
      
      // Remove the ticket from the list
      setUnassignedTickets(prevTickets => {
        const filtered = prevTickets.filter(t => t.id !== ticketId);
        console.log('Remaining tickets:', filtered);
        return filtered;
      });
      
      // Call the callback function
      if (onTicketTaken && typeof onTicketTaken === 'function') {
        onTicketTaken();
      } else {
        console.warn('onTicketTaken callback is not available');
      }
      
    } catch (err) {
      console.error('Error in handleTakeTicket:', err);
      setError('Failed to take ticket. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => ({
    critical: 'bg-red-200 text-red-800',
    high: 'bg-orange-200 text-orange-800',
    medium: 'bg-yellow-200 text-yellow-800',
    low: 'bg-green-200 text-green-800',
  }[priority] || 'bg-gray-200 text-gray-800');

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Network: 'bg-blue-200 text-blue-800',
      Software: 'bg-purple-200 text-purple-800',
      Hardware: 'bg-indigo-200 text-indigo-800',
      Other: 'bg-gray-200 text-gray-800',
    };
    return colors[category] || 'bg-gray-200 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Unassigned Tickets</h2>
        <button
          onClick={fetchUnassignedTickets}
          className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-700"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded flex justify-between items-center">
          {error}
          <button onClick={fetchUnassignedTickets} className="underline">
            Try Again
          </button>
        </div>
      )}

      {unassignedTickets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Ticket className="w-12 h-12 mx-auto mb-3" />
          <p>No unassigned tickets available</p>
          <p className="text-sm mt-1">All tickets have been assigned</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unassignedTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg p-5 flex flex-col justify-between hover:scale-105 transform transition"
            >
              {ticket.image_url && (
                <img
                  src={ticket.image_url}
                  alt={ticket.title}
                  className="w-full h-36 object-cover rounded-lg mb-3"
                />
              )}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    {ticket.title}
                    <div className="relative group">
                      <Info className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
                        {ticket.description}
                      </div>
                    </div>
                  </h3>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-1">
                  <span className={`px-2 py-1 rounded-full ${getCategoryColor(ticket.category)}`}>
                    {ticket.category}
                  </span>
                  <span>Requester: {ticket.requester_name}</span>
                </div>
                {ticket.sla_deadline && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    SLA: {new Date(ticket.sla_deadline).toLocaleString()}
                  </p>
                )}
                {ticket.estimatedTime && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Estimated: {ticket.estimatedTime}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={() => {
                    console.log('View ticket:', ticket.id);
                    onViewTicket(ticket);
                  }}
                  className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => {
                    console.log('Take button clicked for:', ticket.id);
                    handleTakeTicket(ticket.id);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Take
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UnassignedTicketsQueue;