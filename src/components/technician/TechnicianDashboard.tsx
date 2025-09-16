// src/components/technician/TechnicianDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Ticket, Clock, Activity, AlertTriangle, X, MessageSquare, User, AlertCircle } from 'lucide-react';
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
  estimatedTime?: string;
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

type ActiveView =
  | 'dashboard'
  | 'assigned_tickets'
  | 'unassigned_tickets'
  | 'ticket_actions'
  | 'search_tickets'
  | 'performance'
  | 'internal_comments'
  | 'field_report';

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ currentUser }) => {
  const [assignedTickets, setAssignedTickets] = useState<TicketType[]>([]);
  const [unassignedTickets, setUnassignedTickets] = useState<TicketType[]>([]);
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

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
        estimatedTime: '2 hours',
      }));
      setAssignedTickets(tickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load assigned tickets.');
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
        estimatedTime: '2 hours',
      }));
      setUnassignedTickets(tickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load unassigned tickets.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTickets = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .select(
          `*, requester_id:profiles!tickets_requester_id_fkey(full_name), assignee_id:profiles!tickets_assignee_id_fkey(full_name)`
        )
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      const tickets = (data || []).map((t: any) => ({
        ...t,
        requester_name: t.requester_id?.full_name || 'Unknown',
        assignee_name: t.assignee_id?.full_name || 'Unassigned',
        estimatedTime: '2 hours',
      }));
      setAllTickets(tickets);
    } catch (err) {
      console.error(err);
      setError('Failed to load tickets.');
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
    
    switch (activeView) {
      case 'dashboard':
      case 'assigned_tickets':
        fetchAssignedTickets();
        break;
      case 'unassigned_tickets':
        fetchUnassignedTickets();
        break;
      case 'search_tickets':
        fetchAllTickets();
        break;
    }
  }, [activeView, currentUser.id]);

  const handleTakeTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'in_progress', assignee_id: currentUser.id, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      if (error) throw error;
      setUnassignedTickets(prev => prev.filter(t => t.id !== ticketId));
      const ticket = unassignedTickets.find(t => t.id === ticketId);
      if (ticket) setAssignedTickets(prev => [...prev, { ...ticket, status: 'in_progress' }]);
      setSuccess('Ticket assigned to you successfully!');
    } catch (err) {
      console.error(err);
      setError('Failed to take ticket.');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);
      if (error) throw error;
      setAssignedTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, status } : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket({ ...selectedTicket, status });
      setSuccess(`Ticket status updated to ${status.replace('_', ' ')} successfully!`);
    } catch (err) {
      console.error(err);
      setError('Failed to update ticket.');
    }
  };

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

  const dashboardCards = [
    { title: 'Assigned', value: assignedTickets.length, icon: Ticket, color: 'blue', description: 'Tickets assigned to you' },
    { title: 'Open', value: assignedTickets.filter(t => t.status === 'open').length, icon: Clock, color: 'orange', description: 'Tickets waiting for action' },
    { title: 'In Progress', value: assignedTickets.filter(t => t.status === 'in_progress').length, icon: Activity, color: 'yellow', description: 'Active tickets you\'re working on' },
    { title: 'Critical', value: assignedTickets.filter(t => t.priority === 'critical').length, icon: AlertTriangle, color: 'red', description: 'High priority tickets needing attention' },
  ];

  // Get title based on active view
  const getTitle = () => {
    switch (activeView) {
      case 'dashboard': return 'Dashboard';
      case 'assigned_tickets': return 'My Assigned Tickets';
      case 'unassigned_tickets': return 'Unassigned Tickets Queue';
      case 'search_tickets': return 'Search Tickets';
      case 'performance': return 'Performance Overview';
      case 'internal_comments': return 'Internal Comments';
      case 'field_report': return 'Field Reports';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Notification Area */}
      {(error || success) && (
        <div className={`px-6 py-3 ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <p>{error || success}</p>
            <button onClick={() => error ? setError(null) : setSuccess(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{getTitle()}</h1>
          
          <div className="space-y-6">
            {activeView === 'dashboard' && (
              <>
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                  {dashboardCards.map(card => {
                    const Icon = card.icon;
                    const colorMap = {
                      blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
                      orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
                      yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                      red: { bg: 'bg-red-100', text: 'text-red-600' },
                    };
                    return (
                      <div key={card.title} className="bg-white shadow rounded-lg border border-gray-200 p-5 transition-all hover:shadow-md">
                        <div className="flex items-center">
                          <div className={`p-3 rounded-lg ${colorMap[card.color].bg}`}>
                            <Icon className={`w-6 h-6 ${colorMap[card.color].text}`} />
                          </div>
                          <div className="ml-4">
                            <p className="text-sm text-gray-500">{card.title}</p>
                            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">{card.description}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Active Tickets Section */}
                <div className="bg-white shadow rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Your Active Tickets</h2>
                    <span className="text-sm text-gray-500">
                      {assignedTickets.length} tickets
                    </span>
                  </div>
                  
                  <div className="p-6">
                    {assignedTickets.length === 0 ? (
                      <div className="text-center py-8">
                        <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No tickets assigned to you.</p>
                        <p className="text-sm text-gray-400">
                          {loading ? 'Loading...' : 'Check the Available Tickets section to claim new tickets.'}
                        </p>
                        <button 
                          onClick={() => setActiveView('unassigned_tickets')}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          View Available Tickets
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {assignedTickets.map(ticket => (
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
                              {ticket.status === 'open' && (
                                <button 
                                  onClick={() => handleTakeTicket(ticket.id)} 
                                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700"
                                >
                                  Start Work
                                </button>
                              )}

                              <button 
                                onClick={() => openTicketDetails(ticket)} 
                                className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300"
                              >
                                Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Ticket Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${priorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">{selectedTicket.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium capitalize">{selectedTicket.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Estimated Time:</span>
                      <span className="font-medium">{selectedTicket.estimatedTime || 'Not specified'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    People Involved
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requester:</span>
                      <span className="font-medium">{selectedTicket.requester_name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assignee:</span>
                      <span className="font-medium">{selectedTicket.assignee_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(selectedTicket.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium">{new Date(selectedTicket.updated_at).toLocaleDateString()}</span>
                    </div>
                    {selectedTicket.sla_deadline && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">SLA Deadline:</span>
                        <span className="font-medium">{new Date(selectedTicket.sla_deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{selectedTicket.description}</p>
              </div>

              {/* Internal Comments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Internal Comments
                </h3>
                {selectedTicket.internal_comments && selectedTicket.internal_comments.length > 0 ? (
                  <div className="space-y-4">
                    {selectedTicket.internal_comments.map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-800">{comment.technician_name}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No comments yet.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setSelectedTicket(null)} 
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
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