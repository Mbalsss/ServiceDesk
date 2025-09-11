// src/components/technician/AssignedTickets.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface AssignedTicketsProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onViewTicket: (ticket: TicketType) => void;
}

interface CommentType {
  id: string;
  ticket_id: string;
  technician_id: string;
  technician_name: string;
  comment: string;
  created_at: string;
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
  assignee_name?: string;
  estimatedTime?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  sla_deadline?: string;
  internal_comments?: CommentType[];
}

const AssignedTickets: React.FC<AssignedTicketsProps> = ({ currentUser, onViewTicket }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name)
        `)
        .eq("assignee_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (ticketsError) throw ticketsError;

      const transformedTickets: TicketType[] = ticketsData.map(ticket => ({
        ...ticket,
        requester_name: ticket.requester?.full_name || "Unknown",
        assignee_name: currentUser.name,
        estimatedTime: ticket.estimated_time || "Not specified",
      }));

      setTickets(transformedTickets);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to load assigned tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) fetchAssignedTickets();
  }, [currentUser.id]);

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;
      fetchAssignedTickets();
    } catch (err) {
      console.error('Error updating ticket:', err);
    }
  };

  const statusColor = (status: string) => ({
    open: 'text-blue-700 bg-blue-100 border-blue-200',
    in_progress: 'text-orange-700 bg-orange-100 border-orange-200',
    resolved: 'text-green-700 bg-green-100 border-green-200',
    closed: 'text-gray-700 bg-gray-100 border-gray-200',
  }[status] || 'text-gray-700 bg-gray-100 border-gray-200');

  const priorityColor = (priority: string) => ({
    critical: 'text-red-700 bg-red-100',
    high: 'text-orange-700 bg-orange-100',
    medium: 'text-yellow-700 bg-yellow-100',
    low: 'text-gray-700 bg-gray-100',
  }[priority] || 'text-gray-700 bg-gray-100');

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">My Assigned Tickets</h2>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-gray-50 border border-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Tickets</div>
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchAssignedTickets}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">My Assigned Tickets</h2>
        <p className="text-gray-600">
          {tickets.length} tickets assigned to you
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No assigned tickets</p>
          <p className="text-gray-400 text-sm">You don't have any tickets assigned to you yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col justify-between transition-all hover:shadow-md">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900 pr-2 line-clamp-1">{ticket.title}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${priorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-500 border-t pt-4">
                  <span><strong>ID:</strong> {ticket.id.slice(0, 8)}...</span>
                  <span className="capitalize"><strong>Type:</strong> {ticket.type.replace('_', ' ')}</span>
                  <span><strong>Requester:</strong> {ticket.requester_name}</span>
                  <span><strong>Est. Time:</strong> {ticket.estimatedTime}</span>
                  <div className="col-span-2 flex items-center">
                    <strong>Status:</strong>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize border ${statusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={() => onViewTicket(ticket)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition-colors min-w-[120px]"
                >
                  View Details
                </button>
                {ticket.status === 'open' && (
                  <button
                    onClick={() => handleUpdateTicketStatus(ticket.id, 'in_progress')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors min-w-[120px]"
                  >
                    Start Work
                  </button>
                )}
                {ticket.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors min-w-[120px]"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedTickets;