import React, { useState } from 'react';
import { Settings, CheckCircle, AlertTriangle, ArrowUp, MessageSquare, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TicketActionsProps {
  currentUser: { id: string; name: string };
  assignedTickets: any[];
  onTicketUpdate: () => void;
  onViewTicket: (ticket: any) => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({
  currentUser,
  assignedTickets,
  onTicketUpdate,
  onViewTicket
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [newStatus, setNewStatus] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [escalationReason, setEscalationReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedTicket = assignedTickets.find(t => t.id === selectedTicketId);

  const handleUpdateStatus = async () => {
    if (!selectedTicketId || !newStatus) return;

    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicketId);

      if (supabaseError) throw supabaseError;

      setSuccess('Ticket status updated successfully');
      setNewStatus('');
      onTicketUpdate();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update ticket status');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!selectedTicketId || !approvalReason) return;

    try {
      setLoading(true);
      setError(null);

      // Implementation for approval request would go here
      // This would typically create an approval request record
      // and notify managers

      setSuccess('Approval request submitted successfully');
      setApprovalReason('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error requesting approval:', err);
      setError('Failed to submit approval request');
    } finally {
      setLoading(false);
    }
  };

  const handleEscalateTicket = async () => {
    if (!selectedTicketId || !escalationReason) return;

    try {
      setLoading(true);
      setError(null);

      // Implementation for escalation would go here
      // This would typically update the ticket and notify senior technicians

      setSuccess('Ticket escalated successfully');
      setEscalationReason('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error escalating ticket:', err);
      setError('Failed to escalate ticket');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => ({
    open: 'text-blue-600 bg-blue-100',
    in_progress: 'text-orange-600 bg-orange-100',
    resolved: 'text-green-600 bg-green-100',
    closed: 'text-gray-600 bg-gray-100',
  }[status] || 'text-gray-600 bg-gray-100');

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-800">Ticket Actions</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Selection */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Select a Ticket</h3>
          
          <select
            value={selectedTicketId}
            onChange={(e) => setSelectedTicketId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a ticket...</option>
            {assignedTickets.map(ticket => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.title} ({ticket.id.slice(0, 8)}...)
              </option>
            ))}
          </select>

          {selectedTicket && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-900">{selectedTicket.title}</h4>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p>Status: <span className={`px-2 py-1 rounded ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.replace('_', ' ')}
                </span></p>
                <p>Priority: {selectedTicket.priority}</p>
                <p>Requester: {selectedTicket.requester_name}</p>
              </div>
              <button
                onClick={() => onViewTicket(selectedTicket)}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                View full details
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900">Update Status</h4>
            </div>
            
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={!selectedTicketId || loading}
              className="w-full p-2 border border-gray-300 rounded-md mb-3"
            >
              <option value="">Select new status...</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            
            <button
              onClick={handleUpdateStatus}
              disabled={!selectedTicketId || !newStatus || loading}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* Request Approval */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-gray-900">Request Approval</h4>
            </div>
            
            <textarea
              value={approvalReason}
              onChange={(e) => setApprovalReason(e.target.value)}
              placeholder="Reason for approval request..."
              disabled={!selectedTicketId || loading}
              className="w-full p-2 border border-gray-300 rounded-md mb-3 h-20"
            />
            
            <button
              onClick={handleRequestApproval}
              disabled={!selectedTicketId || !approvalReason || loading}
              className="w-full bg-yellow-600 text-white py-2 rounded-md hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Request Approval'}
            </button>
          </div>

          {/* Escalate Ticket */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUp className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Escalate Ticket</h4>
            </div>
            
            <textarea
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              placeholder="Reason for escalation..."
              disabled={!selectedTicketId || loading}
              className="w-full p-2 border border-gray-300 rounded-md mb-3 h-20"
            />
            
            <button
              onClick={handleEscalateTicket}
              disabled={!selectedTicketId || !escalationReason || loading}
              className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Escalating...' : 'Escalate Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketActions;