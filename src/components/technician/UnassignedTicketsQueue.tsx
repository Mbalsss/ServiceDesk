// src/components/technician/UnassignedTicketsQueue.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: string;
  requester_name: string;
  estimatedTime?: string;
  created_at: string;
  category: string;
}

interface UnassignedTicketsQueueProps {
  currentUser: any;
  onTicketTaken: () => void;
  onViewTicket: (ticket: Ticket) => void;
}

const UnassignedTicketsQueue: React.FC<UnassignedTicketsQueueProps> = ({ 
  currentUser, 
  onTicketTaken, 
  onViewTicket 
}) => {
  const [unassignedTickets, setUnassignedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUnassignedTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name)
        `)
        .is('assignee_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const tickets = data.map((ticket: any) => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        category: ticket.category || 'General',
        requester_name: ticket.requester?.full_name || 'Unknown',
        estimatedTime: ticket.estimated_time || 'Not specified',
        created_at: ticket.created_at
      }));

      setUnassignedTickets(tickets);
    } catch (error) {
      console.error('Error fetching unassigned tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnassignedTickets();
  }, []);

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

  const handleTakeTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assignee_id: currentUser.id,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      setUnassignedTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      onTicketTaken();
      
    } catch (error) {
      console.error('Error taking ticket:', error);
    }
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unassigned Tickets Queue</h2>
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Unassigned Tickets Queue</h2>
        <p className="text-gray-600">
          {unassignedTickets.length} unassigned tickets available
        </p>
      </div>
      
      {unassignedTickets.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium mb-2">No unassigned tickets</p>
          <p className="text-gray-400 text-sm">All tickets have been assigned to technicians</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {unassignedTickets.map((ticket) => (
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
                  onClick={() => handleViewDetails(ticket)}
                  className="flex-1 px-3 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition-colors min-w-[120px]"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleTakeTicket(ticket.id)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors min-w-[120px]"
                >
                  Take Ticket
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Simple Ticket Details Modal */}
      {showModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-800">{selectedTicket.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ticket Details</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2.5 py-1 rounded text-xs capitalize border ${statusColor(selectedTicket.status)}`}>
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
                      <span className="font-medium">{selectedTicket.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Requester Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requester:</span>
                      <span className="font-medium">{selectedTicket.requester_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(selectedTicket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleTakeTicket(selectedTicket.id);
                    closeModal();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Take Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnassignedTicketsQueue;