import React, { useState, useEffect } from 'react';
import { Filter, Search, Eye, MoreHorizontal, Plus, X } from 'lucide-react';
import { Ticket } from '../types';
import CreateTicket from './CreateTicket';
import TicketDetails from './TicketDetails';

interface Technician {
  id: string;
  name: string;
  available: boolean;
}

interface TicketListProps {
  tickets?: Ticket[];
  onTicketSelect: (ticketId: string) => void;
  onTicketCreate: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAssignTicket: (ticketId: string, technicianId: string) => void;
  currentUserName: string;
  technicians?: Technician[];
  setTechnicians: React.Dispatch<React.SetStateAction<Technician[]>>;
  currentUserId: string;
  currentUserRole: string;
}

const TicketList: React.FC<TicketListProps> = ({
  tickets = [],
  onTicketSelect,
  onTicketCreate,
  onAssignTicket,
  currentUserName,
  technicians = [],
  setTechnicians,
  currentUserId,
  currentUserRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [localTickets, setLocalTickets] = useState<Ticket[]>(tickets);

  useEffect(() => {
    setLocalTickets(tickets || []);
  }, [tickets]);

  const filteredTickets = localTickets.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleAutoAssign = (ticketId: string) => {
    const availableTech = technicians.find(t => t.available);
    if (!availableTech) {
      alert('No available technicians at the moment.');
      return;
    }

    setLocalTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, assignee: availableTech.name } : ticket
      )
    );

    setTechnicians(prev =>
      prev.map(t => (t.id === availableTech.id ? { ...t, available: false } : t))
    );

    onAssignTicket(ticketId, availableTech.id);
  };

  const handleViewDetails = (ticketId: string) => {
    const ticket = localTickets.find(t => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      setShowTicketDetails(true);
    }
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Tickets</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-2 py-1 w-full border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-gray-700 text-sm hover:bg-gray-200">
          <Filter className="w-3 h-3" />
          <span>Filters</span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Ticket</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Assignee</th>
              <th className="px-3 py-2">Requester</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTickets.length > 0 ? (
              filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900 truncate max-w-xs">{ticket.title}</div>
                  </td>
                  <td className="px-3 py-2">{ticket.type}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2">{ticket.assignee || 'Unassigned'}</td>
                  <td className="px-3 py-2">{ticket.requester || 'Unknown'}</td>
                  <td className="px-3 py-2">{ticket.createdAt?.toLocaleDateString() || '-'}</td>
                  <td className="px-3 py-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(ticket.id)}
                      className="p-1 text-gray-600 hover:text-blue-600 rounded"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAutoAssign(ticket.id)}
                      className="p-1 text-gray-600 hover:text-purple-600 rounded"
                      title="Auto-Assign"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-600 hover:text-gray-900 rounded" title="More Actions">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-6 text-gray-500">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl relative p-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <CreateTicket
              currentUserName={currentUserName}
              onTicketCreate={(ticket) => {
                onTicketCreate(ticket);
                setShowCreateModal(false);
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {showTicketDetails && selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          onClose={() => {
            setShowTicketDetails(false);
            setSelectedTicket(null);
          }}
          onUpdate={() => console.log("Ticket updated")}
          onResolved={() => console.log("Ticket resolved")}
        />
      )}
    </div>
  );
};

export default TicketList;
