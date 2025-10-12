// src/components/technician/TechnicianDashboard.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface TechnicianDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onLogout?: () => void;
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
  image_url?: string;
  created_at: string;
  updated_at: string;
  sla_deadline?: string;
  internal_comments?: CommentType[];
}

interface CommentType {
  id: string;
  ticket_id: string;
  technician_id: string;
  technician_name: string;
  comment: string;
  created_at: string;
}

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ currentUser }) => {
  const [assignedTickets, setAssignedTickets] = useState<TicketType[]>([]);
  const [unassignedTickets, setUnassignedTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .select(
          `*, requester_id:profiles!tickets_requester_id_fkey(full_name), assignee_id:profiles!tickets_assignee_id_fkey(full_name)`
        )
        .eq('assignee_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      const tickets = (data || []).map((t: any) => ({
        ...t,
        requester_name: t.requester_id?.full_name || 'Unknown',
        assignee_name: t.assignee_id?.full_name || 'Unassigned',
      }));
      setAssignedTickets(tickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load your tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnassignedTickets = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .select(`*, requester_id:profiles!tickets_requester_id_fkey(full_name)`)
        .is('assignee_id', null)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      const tickets = (data || []).map((t: any) => ({
        ...t,
        requester_name: t.requester_id?.full_name || 'Unknown',
      }));
      setUnassignedTickets(tickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load unassigned tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketComments = async (ticketId: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('ticket_comments')
        .select(`*, technician_id:profiles!ticket_comments_technician_id_fkey(full_name)`)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (supabaseError) throw supabaseError;
      return (data || []).map((c: any) => ({
        id: c.id,
        ticket_id: c.ticket_id,
        technician_id: c.technician_id,
        technician_name: c.technician_id?.full_name || 'Unknown',
        comment: c.comment,
        created_at: c.created_at,
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetchAssignedTickets();
    fetchUnassignedTickets();
  }, [currentUser.id]);

  const openTicketDetails = async (ticket: TicketType) => {
    const comments = await fetchTicketComments(ticket.id);
    setSelectedTicket({ ...ticket, internal_comments: comments });
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

  // Calculate SLA status - returns empty for closed/resolved tickets
  const getSLAStatus = (slaDeadline: string | undefined, status: string) => {
    // Don't show SLA for closed or resolved tickets
    if (status === 'closed' || status === 'resolved') {
      return { text: '', color: '' };
    }
    
    if (!slaDeadline) return { text: 'No SLA', color: 'text-gray-500' };
    
    const now = new Date();
    const deadline = new Date(slaDeadline);
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff < 0) return { text: 'SLA Breached', color: 'text-red-600' };
    if (hoursDiff < 24) return { text: 'Due Soon', color: 'text-orange-600' };
    return { text: 'On Track', color: 'text-green-600' };
  };

  const dashboardCards = [
    { 
      title: 'Total Assigned', 
      value: assignedTickets.length, 
      color: 'blue', 
      description: 'All tickets assigned to you' 
    },
    { 
      title: 'Waiting Action', 
      value: unassignedTickets.length, 
      color: 'orange', 
      description: 'Unassigned tickets available to claim' 
    },
    { 
      title: 'In Progress', 
      value: assignedTickets.filter(t => t.status === 'in_progress').length, 
      color: 'yellow', 
      description: 'Active tickets you\'re working on' 
    },
    { 
      title: 'Critical Priority', 
      value: assignedTickets.filter(t => t.priority === 'critical').length, 
      color: 'red', 
      description: 'High priority tickets needing immediate attention' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Notification Area - Mobile Improved */}
      {(error || success) && (
        <div className={`px-4 py-3 ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <div className="flex justify-between items-center">
            <p className="text-sm break-words flex-1 pr-2">{error || success}</p>
            <button 
              onClick={() => error ? setError(null) : setSuccess(null)} 
              className="flex-shrink-0 text-lg font-bold w-6 h-6 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        <div className="px-2 sm:px-0">
          {/* Technician Dashboard Header - Mobile Improved */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Technician Dashboard</h1>
            <div className="border-b border-gray-200 pb-3 sm:pb-4 mt-2">
              <p className="text-xs sm:text-sm text-gray-500">
                Manage your assigned tickets, track progress, and update ticket status
              </p>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            {/* Dashboard Stats - Mobile Improved */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {dashboardCards.map(card => {
                const colorMap = {
                  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
                  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                  red: { bg: 'bg-red-100', text: 'text-red-600' },
                };
                const colors = colorMap[card.color as keyof typeof colorMap];
                return (
                  <div key={card.title} className="bg-white shadow rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-5 transition-all hover:shadow-md">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2 truncate">{card.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">{card.value}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 sm:mt-3 line-clamp-2">{card.description}</p>
                  </div>
                );
              })}
            </div>

            {/* My Active Tickets Section - Mobile Improved */}
            <div className="bg-white shadow rounded-lg border border-gray-200">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">My Active Tickets</h2>
                <span className="text-xs sm:text-sm text-gray-500 bg-blue-50 px-2 sm:px-3 py-1 rounded-full self-start sm:self-auto">
                  {assignedTickets.length} tickets in your queue
                </span>
              </div>
              
              <div className="p-3 sm:p-4 lg:p-6">
                {assignedTickets.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-gray-500 mb-2 text-sm sm:text-base">No tickets assigned to you.</p>
                    <p className="text-xs sm:text-sm text-gray-400">
                      {loading ? 'Loading...' : 'All your assigned tickets will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {assignedTickets.map(ticket => {
                      const slaStatus = getSLAStatus(ticket.sla_deadline, ticket.status);
                      
                      return (
                        <div key={ticket.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 lg:p-5 flex flex-col justify-between transition-all hover:shadow-md">
                          <div>
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1 line-clamp-2 min-w-0">{ticket.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${priorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">{ticket.description}</p>
                            <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs sm:text-sm text-gray-500 border-t pt-3 sm:pt-4">
                              <span className="truncate"><strong>ID:</strong> {ticket.id.slice(0, 6)}...</span>
                              <span className="truncate capitalize"><strong>Type:</strong> {ticket.type.replace('_', ' ')}</span>
                              <span className="truncate"><strong>Requester:</strong> {ticket.requester_name}</span>
                              {/* Only show SLA if it has text (not for closed/resolved tickets) */}
                              {slaStatus.text ? (
                                <span className={`truncate ${slaStatus.color}`}>{slaStatus.text}</span>
                              ) : (
                                <span className="truncate text-gray-400">Completed</span>
                              )}
                              <div className="col-span-2 flex items-center gap-1 sm:gap-2">
                                <strong className="whitespace-nowrap">Status:</strong>
                                <span className={`px-2 py-0.5 rounded text-xs capitalize border flex-1 truncate ${statusColor(ticket.status)}`}>
                                  {ticket.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                            <button 
                              onClick={() => openTicketDetails(ticket)} 
                              className="w-full px-3 py-2 bg-gray-200 text-gray-800 text-xs sm:text-sm font-semibold rounded-md hover:bg-gray-300 active:scale-95 transition-transform"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal - Mobile Improved */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] sm:max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3 sm:p-4 flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">Ticket Details</h2>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="text-gray-500 hover:text-gray-800 text-xl sm:text-2xl flex-shrink-0 w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Ticket Details - Mobile Improved */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                    Ticket Details
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm sm:text-base">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${priorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Type:</span>
                      <span className="font-medium capitalize text-sm sm:text-base">{selectedTicket.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Category:</span>
                      <span className="font-medium capitalize text-sm sm:text-base">{selectedTicket.category}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                    People & Timeline
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Requester:</span>
                      <span className="font-medium text-sm sm:text-base truncate pl-2">{selectedTicket.requester_name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Assignee:</span>
                      <span className="font-medium text-sm sm:text-base truncate pl-2">{selectedTicket.assignee_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Created:</span>
                      <span className="font-medium text-sm sm:text-base">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm sm:text-base">Last Updated:</span>
                      <span className="font-medium text-sm sm:text-base">{new Date(selectedTicket.updated_at).toLocaleDateString()}</span>
                    </div>
                    {/* Only show SLA for active tickets */}
                    {selectedTicket.sla_deadline && selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm sm:text-base">SLA Deadline:</span>
                          <span className="font-medium text-sm sm:text-base">{new Date(selectedTicket.sla_deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 text-sm sm:text-base">SLA Status:</span>
                          <span className={`font-medium text-sm sm:text-base ${getSLAStatus(selectedTicket.sla_deadline, selectedTicket.status).color}`}>
                            {getSLAStatus(selectedTicket.sla_deadline, selectedTicket.status).text}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg text-sm sm:text-base">{selectedTicket.description}</p>
              </div>

              {/* Internal Comments */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                  Internal Comments
                </h3>
                {selectedTicket.internal_comments && selectedTicket.internal_comments.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {selectedTicket.internal_comments.map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1">
                          <span className="font-medium text-gray-800 text-sm sm:text-base">{comment.technician_name}</span>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm sm:text-base">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm sm:text-base">No comments yet.</p>
                )}
              </div>

              {/* Action Buttons - Mobile Improved */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 active:scale-95 transition-transform text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;