import React, { useState, useEffect } from 'react';
import { Filter, Search, Eye, MoreHorizontal, Plus, X, Calendar, User, FileText } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);
  const [moreActionsOpen, setMoreActionsOpen] = useState<string | null>(null);

  useEffect(() => {
    setLocalTickets(tickets || []);
  }, [tickets]);

  const filteredTickets = localTickets.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.requester?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border border-green-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'resolved': return 'bg-green-100 text-green-800 border border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: dateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const toggleMoreActions = (ticketId: string) => {
    setMoreActionsOpen(moreActionsOpen === ticketId ? null : ticketId);
  };

  // Close more actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setMoreActionsOpen(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
          <p className="text-gray-600 mt-1">Manage and track all service requests</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets, requesters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2.5 bg-gray-100 rounded-lg text-gray-700 text-sm hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option>All Assignees</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                  placeholder="Filter by requester"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="date" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                  />
                  <span className="text-gray-500">to</span>
                  <input 
                    type="date" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket Details
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requester
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.length > 0 ? (
                filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <FileText className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <span className="font-mono">#{ticket.id.substring(0, 8)}</span>
                            <span className="mx-2">•</span>
                            <span>{ticket.type}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.assignee || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.requester || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewDetails(ticket.id)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {!ticket.assignee && (
                          <button
                            onClick={() => handleAutoAssign(ticket.id)}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                            title="Auto-Assign"
                          >
                            <User className="w-4 h-4" />
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMoreActions(ticket.id);
                            }}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors" 
                            title="More Actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {/* More Actions Dropdown */}
                          {moreActionsOpen === ticket.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                  Edit Ticket
                                </button>
                                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                                  Delete Ticket
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <p className="text-lg font-medium">No tickets found</p>
                      <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      <button 
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setPriorityFilter('all');
                        }}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Clear all filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredTickets.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredTickets.length}</span> of{' '}
            <span className="font-medium">{localTickets.length}</span> tickets
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-blue-50 text-blue-600 font-medium">
              1
            </button>
            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New Ticket</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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