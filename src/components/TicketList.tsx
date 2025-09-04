import React, { useState, useEffect } from 'react';
import { Filter, Search, Eye, Edit, MoreHorizontal, Plus, X } from 'lucide-react';
import { Ticket } from '../types';
import CreateTicket from './CreateTicket';

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
}

const TicketList: React.FC<TicketListProps> = ({
  tickets = [],
  onTicketSelect,
  onTicketCreate,
  onAssignTicket,
  currentUserName,
  technicians = [],
  setTechnicians
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // AUTO-ASSIGN TECHNICIAN
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Tickets</h2>
          <p className="text-gray-600">Manage and track all service requests and incidents</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Ticket</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr key="table-header">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Priority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Assignee</th>
                <th className="px-6 py-3">Requester</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.title}</div>
                    </td>
                    <td className="px-6 py-4">{ticket.type}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">{ticket.assignee || 'Unassigned'}</td>
                    <td className="px-6 py-4">{ticket.requester || 'Unknown'}</td>
                    <td className="px-6 py-4">{ticket.createdAt?.toLocaleDateString() || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onTicketSelect(ticket.id)}
                          className="p-2 text-gray-600 hover:text-blue-600 rounded-lg"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAutoAssign(ticket.id)}
                          className="p-2 text-gray-600 hover:text-purple-600 rounded-lg"
                          title="Assign Technician Automatically"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-green-600 rounded-lg" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg" title="More Actions">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    No tickets found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-3 right-3 p-2 text-gray-500 hover:text-gray-700"
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
    </div>
  );
};

export default TicketList;
