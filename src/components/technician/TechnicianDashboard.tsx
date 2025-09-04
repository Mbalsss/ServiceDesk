import React, { useState, useEffect } from 'react';
import {
  Ticket, Clock, Activity, AlertTriangle, X, Menu, LogOut, Bell, Settings
} from 'lucide-react';
// CHANGE 1: The 'Sidebar' import is removed as it is no longer rendered here.
// import Sidebar from '../Sidebar';
import AssignedTickets from './AssignedTickets';
import UnassignedTicketsQueue from './UnassignedTicketsQueue';
import TicketActions from './TicketAction';
import SearchFilterTickets from './SearchFilterTickets';
import PerformanceOverview from './PerformanceOverview';
import InternalComments from './InternalComments';
import FieldReport from './FieldReport';
import { supabase } from '../../lib/supabase';

interface TechnicianDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
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

type ActiveView = 'dashboard' | 'assigned_tickets' | 'unassigned_tickets' | 'ticket_actions' |
                  'search_tickets' | 'performance' | 'internal_comments' | 'field_report' |
                  'team_chat' | 'staff' | 'schedule' | 'knowledge' | 'equipment' | 'reports';

const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({ currentUser, onLogout }) => {
  const [assignedTickets, setAssignedTickets] = useState<TicketType[]>([]);
  const [unassignedTickets, setUnassignedTickets] = useState<TicketType[]>([]);
  const [allTickets, setAllTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  
  // States related to the old, duplicated header/sidebar are removed.
  // The main App.js will handle the state for opening/closing the primary sidebar.
  // The main Header.js will handle its own state for notifications/profile dropdowns.

  // ==================================================================
  // ALL YOUR ORIGINAL FUNCTIONS AND LOGIC ARE PRESERVED BELOW
  // ==================================================================

  const fetchAssignedTickets = async () => {
    try {
      setLoading(true);
      const { data, error: supabaseError } = await supabase
        .from('tickets')
        .select(`*, requester_id:profiles!tickets_requester_id_fkey(full_name), assignee_id:profiles!tickets_assignee_id_fkey(full_name)`)
        .eq('assignee_id', currentUser.id)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      const transformedTickets: TicketType[] = (data || []).map(ticket => ({
        ...ticket,
        requester_name: ticket.requester_id?.full_name || 'Unknown',
        assignee_name: ticket.assignee_id?.full_name || 'Unassigned',
        estimatedTime: '2 hours'
      }));
      setAssignedTickets(transformedTickets);
    } catch (err) {
      console.error('Error fetching assigned tickets:', err);
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
      const transformedTickets: TicketType[] = (data || []).map(ticket => ({
        ...ticket,
        requester_name: ticket.requester_id?.full_name || 'Unknown',
        estimatedTime: '2 hours'
      }));
      setUnassignedTickets(transformedTickets);
    } catch (err) {
      console.error('Error fetching unassigned tickets:', err);
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
        .select(`*, requester_id:profiles!tickets_requester_id_fkey(full_name), assignee_id:profiles!tickets_assignee_id_fkey(full_name)`)
        .order('created_at', { ascending: false });
      if (supabaseError) throw supabaseError;
      const transformedTickets: TicketType[] = (data || []).map(ticket => ({
        ...ticket,
        requester_name: ticket.requester_id?.full_name || 'Unknown',
        assignee_name: ticket.assignee_id?.full_name || 'Unassigned',
        estimatedTime: '2 hours'
      }));
      setAllTickets(transformedTickets);
    } catch (err) {
      console.error('Error fetching all tickets:', err);
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
      const comments: CommentType[] = (data || []).map(comment => ({
        id: comment.id,
        ticket_id: comment.ticket_id,
        technician_id: comment.technician_id,
        technician_name: comment.technician_id?.full_name || 'Unknown',
        comment: comment.comment,
        created_at: comment.created_at
      }));
      return comments;
    } catch (err) {
      console.error('Error fetching comments:', err);
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

  const addCommentToTicket = async (ticketId: string, comment: string) => {
    try {
      const { error: supabaseError } = await supabase.from('ticket_comments').insert({ ticket_id: ticketId, technician_id: currentUser.id, comment: comment, created_at: new Date().toISOString() });
      if (supabaseError) throw supabaseError;
      const comments = await fetchTicketComments(ticketId);
      setSelectedTicket(prev => prev ? { ...prev, internal_comments: comments } : null);
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment.');
    }
  };

  const handleTakeTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase.from('tickets').update({ status: 'in_progress', assignee_id: currentUser.id, updated_at: new Date().toISOString() }).eq('id', ticketId);
      if (error) throw error;
      setUnassignedTickets(tickets => tickets.filter(t => t.id !== ticketId));
      const takenTicket = unassignedTickets.find(t => t.id === ticketId);
      if (takenTicket) {
        setAssignedTickets(tickets => [...tickets, { ...takenTicket, status: 'in_progress' }]);
      }
    } catch (err) {
      console.error('Error taking ticket:', err);
      setError('Failed to take ticket.');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase.from('tickets').update({ status: status, updated_at: new Date().toISOString() }).eq('id', ticketId);
      if (error) throw error;
      setAssignedTickets(tickets => tickets.map(t => t.id === ticketId ? { ...t, status } : t));
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Failed to update ticket.');
    }
  };

  const handleRequestApproval = async (ticketId: string) => { setError('Approval request feature not yet implemented'); };
  const handleEscalateTicket = async (ticketId: string, reason: string) => { setError('Escalation feature not yet implemented'); };
  const handleTicketTaken = () => { fetchAssignedTickets(); fetchUnassignedTickets(); };
  const handleTicketUpdate = () => { fetchAssignedTickets(); };

  const openTicketDetails = async (ticket: TicketType) => {
    const comments = await fetchTicketComments(ticket.id);
    setSelectedTicket({ ...ticket, internal_comments: comments });
  };

  const totalAssigned = assignedTickets.length;
  const openTickets = assignedTickets.filter(t => t.status === 'open').length;
  const inProgressTickets = assignedTickets.filter(t => t.status === 'in_progress').length;
  const criticalTickets = assignedTickets.filter(t => t.priority === 'critical').length;

  const getStatusColor = (status: string) => ({ open: 'text-blue-600 bg-blue-100 border-blue-200', in_progress: 'text-orange-600 bg-orange-100 border-orange-200', resolved: 'text-green-600 bg-green-100 border-green-200', closed: 'text-gray-600 bg-gray-100 border-gray-200' }[status] || 'text-gray-600 bg-gray-100 border-gray-200');
  const getPriorityColor = (priority: string) => ({ critical: 'text-red-700 bg-red-100', high: 'text-orange-700 bg-orange-100', medium: 'text-yellow-700 bg-yellow-100', low: 'text-gray-700 bg-gray-100' }[priority] || 'text-gray-700 bg-gray-100');
  
  if (loading && activeView !== 'dashboard') {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // CHANGE 2: The entire return statement is simplified. It no longer contains
  // the outer layout div, the Sidebar components, or the Header component.
  return (
    <>
      <main className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-6">
        {activeView === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {[ { title: 'Assigned', value: totalAssigned, icon: Ticket, color: 'blue' }, { title: 'Open', value: openTickets, icon: Clock, color: 'orange' }, { title: 'In Progress', value: inProgressTickets, icon: Activity, color: 'yellow' }, { title: 'Critical', value: criticalTickets, icon: AlertTriangle, color: 'red' }
              ].map(card => {
                const colorMap = { blue: { bg: 'bg-blue-100', text: 'text-blue-600' }, orange: { bg: 'bg-orange-100', text: 'text-orange-600' }, yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' }, red: { bg: 'bg-red-100', text: 'text-red-600' } };
                const Icon = card.icon;
                const colorClasses = colorMap[card.color as keyof typeof colorMap];
                return (
                  <div key={card.title} className="bg-white shadow-sm rounded-lg border border-gray-200 p-5 flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${colorClasses.bg}`}><Icon className={`w-6 h-6 ${colorClasses.text}`}/></div>
                    <div><p className="text-sm text-gray-500">{card.title}</p><p className="text-2xl font-bold text-gray-800">{card.value}</p></div>
                  </div>
                )
              })}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Active Tickets</h2>
              {assignedTickets.length === 0 ? (
                <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No tickets assigned to you.</p>
                  <p className="text-sm text-gray-400">{loading ? 'Loading...' : 'You will see tickets here when they are assigned to you.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {assignedTickets.map(ticket => (
                    <div key={ticket.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900 pr-2">{ticket.title}</h3>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{ticket.description}</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-500 border-t pt-4">
                          <span><strong>ID:</strong> {ticket.id.slice(0, 8)}...</span>
                          <span className="capitalize"><strong>Type:</strong> {ticket.type.replace('_', ' ')}</span>
                          <span><strong>Requester:</strong> {ticket.requester_name}</span>
                          <span><strong>Est. Time:</strong> {ticket.estimatedTime}</span>
                          <div className="col-span-2 flex items-center">
                            <strong>Status:</strong><span className={`ml-2 px-2 py-0.5 rounded text-xs capitalize border ${getStatusColor(ticket.status)}`}>{ticket.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        {ticket.status === 'open' && (<button onClick={() => handleTakeTicket(ticket.id)} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Take Ticket</button>)}
                        {ticket.status === 'in_progress' && (<button onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved')} className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700">Resolve</button>)}
                        <button onClick={() => openTicketDetails(ticket)} className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg hover:bg-gray-300">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {activeView === 'assigned_tickets' && (<AssignedTickets currentUser={currentUser} onViewTicket={openTicketDetails} />)}
        {activeView === 'unassigned_tickets' && (<UnassignedTicketsQueue currentUser={currentUser} onTicketTaken={handleTicketTaken} onViewTicket={openTicketDetails} />)}
        {activeView === 'ticket_actions' && (<TicketActions currentUser={currentUser} assignedTickets={assignedTickets} onTicketUpdate={handleTicketUpdate} onViewTicket={openTicketDetails} />)}
        {activeView === 'search_tickets' && (<SearchFilterTickets currentUser={currentUser} onViewTicket={openTicketDetails} />)}
        {activeView === 'performance' && (<PerformanceOverview assignedTickets={assignedTickets} />)}
        {activeView === 'internal_comments' && (<InternalComments currentUser={currentUser} assignedTickets={assignedTickets} onViewTicket={openTicketDetails} />)}
        {activeView === 'field_report' && (<FieldReport technicianName={currentUser.name} />)}
      </main>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{selectedTicket.title}</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-500 hover:text-gray-800">
                <X className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Ticket Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><strong>Ticket ID:</strong> {selectedTicket.id}</div>
                  <div><strong>Type:</strong> {selectedTicket.type.replace('_', ' ')}</div>
                  <div><strong>Priority:</strong> <span className={`ml-2 px-2 py-1 rounded text-xs ${getPriorityColor(selectedTicket.priority)}`}>{selectedTicket.priority}</span></div>
                  <div><strong>Status:</strong> <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedTicket.status)}`}>{selectedTicket.status.replace('_', ' ')}</span></div>
                  <div><strong>Requester:</strong> {selectedTicket.requester_name}</div>
                  <div><strong>Category:</strong> {selectedTicket.category}</div>
                  <div><strong>Estimated Time:</strong> {selectedTicket.estimatedTime}</div>
                  {selectedTicket.sla_deadline && ( <div><strong>SLA Deadline:</strong> {new Date(selectedTicket.sla_deadline).toLocaleString()}</div> )}
                </div>
              </div>
              <div><h3 className="text-lg font-medium text-gray-800 mb-2">Description</h3><p className="text-gray-600">{selectedTicket.description}</p></div>
              {selectedTicket.image_url && ( <div><h3 className="text-lg font-medium text-gray-800 mb-2">Attachment</h3><img src={selectedTicket.image_url} alt="Ticket attachment" className="max-w-full h-auto rounded border border-gray-200" /></div> )}
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Internal Comments</h3>
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                  {selectedTicket.internal_comments && selectedTicket.internal_comments.length > 0 ? (
                    selectedTicket.internal_comments.map(comment => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2"><span className="font-medium text-gray-900">{comment.technician_name}</span><span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span></div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))
                  ) : ( <p className="text-gray-500">No comments yet.</p> )}
                </div>
                <div className="border-t pt-4">
                  <textarea placeholder="Add an internal comment..." className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" rows={3} id="comment-textarea"/>
                  <button onClick={() => { const textarea = document.getElementById('comment-textarea') as HTMLTextAreaElement; if (textarea && textarea.value.trim()) { addCommentToTicket(selectedTicket.id, textarea.value.trim()); textarea.value = ''; } }} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add Comment</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedTicket.status === 'open' && (<button onClick={() => handleTakeTicket(selectedTicket.id)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Take Ticket</button>)}
                {selectedTicket.status === 'in_progress' && (<button onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'resolved')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Mark Resolved</button>)}
                <button onClick={() => handleRequestApproval(selectedTicket.id)} className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">Request Approval</button>
                <button onClick={() => handleEscalateTicket(selectedTicket.id, 'Need assistance')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Escalate</button>
                <button onClick={() => setSelectedTicket(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TechnicianDashboard;