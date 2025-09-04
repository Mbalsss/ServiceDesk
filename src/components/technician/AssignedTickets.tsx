import React, { useState, useEffect } from 'react';
import { Ticket, Clock, User, AlertCircle, RefreshCw, Info, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AssignedTicketsProps {
  currentUser: { id: string; name: string; email: string; role: string };
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
  assignee_name?: string;
  estimatedTime?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  sla_deadline?: string;
}

const AssignedTickets: React.FC<AssignedTicketsProps> = ({ currentUser, onViewTicket }) => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching tickets for user:', currentUser.id);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('assignee_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Supabase error:', ticketsError);
        throw ticketsError;
      }

      console.log('Raw tickets data:', ticketsData);

      if (!ticketsData || ticketsData.length === 0) {
        console.log('No tickets found for user');
        setTickets([]);
        setLoading(false);
        return;
      }

      const requesterIds = [...new Set(ticketsData.map(t => t.requester_id).filter(Boolean))];
      let usersMap = new Map();
      
      if (requesterIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', requesterIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          usersData?.forEach(user => usersMap.set(user.id, user.full_name));
        }
      }

      const transformedTickets: TicketType[] = ticketsData.map(ticket => ({
        ...ticket,
        requester_name: usersMap.get(ticket.requester_id) || 'Unknown',
        assignee_name: currentUser.name,
        estimatedTime: ticket.estimated_time || '2 hours', // Fixed field name
      }));

      console.log('Transformed tickets:', transformedTickets);
      setTickets(transformedTickets);
    } catch (err) {
      console.error('Error in fetchAssignedTickets:', err);
      setError('Failed to load assigned tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchAssignedTickets();
    }
  }, [currentUser.id]);

  const filteredTickets = filterStatus === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === filterStatus);

  const getStatusColor = (status: string) => ({
    open: 'text-blue-600 bg-blue-100',
    in_progress: 'text-orange-600 bg-orange-100',
    resolved: 'text-green-600 bg-green-100',
    closed: 'text-gray-600 bg-gray-100',
  }[status] || 'text-gray-600 bg-gray-100');

  const getPriorityColor = (priority: string) => ({
    critical: 'text-red-700 bg-red-100',
    high: 'text-orange-700 bg-orange-100',
    medium: 'text-yellow-700 bg-yellow-100',
    low: 'text-gray-700 bg-gray-100',
  }[priority] || 'text-gray-700 bg-gray-100');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      case 'resolved': return <Ticket className="w-4 h-4" />;
      case 'closed': return <User className="w-4 h-4" />;
      default: return <Ticket className="w-4 h-4" />;
    }
  };

  const handleCardClick = (ticket: TicketType, e: React.MouseEvent) => {
    // Prevent click if the click was on a button or interactive element
    if ((e.target as HTMLElement).tagName === 'BUTTON' || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    console.log('Viewing ticket:', ticket);
    onViewTicket(ticket);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <div className="text-lg text-gray-600">Loading tickets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Error Loading Tickets</div>
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchAssignedTickets}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Filter Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">My Assigned Tickets</h2>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={fetchAssignedTickets}
            className="p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            title="Refresh tickets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg shadow border border-gray-200">
            <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">
              {filterStatus === 'all'
                ? 'No tickets assigned to you yet.'
                : `No ${filterStatus.replace('_', ' ')} tickets.`}
            </p>
            <p className="text-sm text-gray-400">Tickets assigned to you will appear here.</p>
          </div>
        ) : (
          filteredTickets.map(ticket => (
            <div
              key={ticket.id}
              className="bg-white shadow-md rounded-xl border border-gray-200 p-5 hover:shadow-lg transform transition cursor-pointer flex flex-col justify-between"
              onClick={(e) => handleCardClick(ticket, e)}
            >
              {ticket.image_url && (
                <img
                  src={ticket.image_url}
                  alt={ticket.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {ticket.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>Requester: {ticket.requester_name}</span>
                </div>
                <div>Category: {ticket.category}</div>
                <div>Type: {ticket.type.replace('_', ' ')}</div>
                {ticket.estimatedTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Est. Time: {ticket.estimatedTime}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
              </div>

              <button 
                className="mt-3 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 w-full text-center"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('View details clicked for:', ticket.id);
                  onViewTicket(ticket);
                }}
              >
                View Details →
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignedTickets;