import React, { useState, useEffect, useCallback } from "react";
import CreateTicket from "./../CreateTicket";
import { supabase } from "../../lib/supabase";
import { Ticket } from "../../types";
import { 
  Loader2, 
  Inbox,
  Search,
  Filter,
  Plus
} from "lucide-react";

interface UserDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser }) => {
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchTickets = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("requester_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserTickets(data || []);
    } catch (error) {
      console.error(error);
      setError("Failed to load tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser.id]);

  useEffect(() => { 
    fetchTickets();
  }, [fetchTickets]);

  const handleTicketCreate = () => {
    setShowCreateTicket(false);
    fetchTickets();
  };

  const filteredTickets = userTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-blue-600 bg-blue-50 border-blue-200";
      case "in_progress": return "text-amber-600 bg-amber-50 border-amber-200";
      case "resolved": return "text-green-600 bg-green-50 border-green-200";
      case "closed": return "text-gray-600 bg-gray-50 border-gray-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-600";
      case "high": return "text-orange-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatText = (text: string) => {
    return text.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <div className="p-4 sm:p-5 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow duration-200">
      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-xs sm:text-sm text-gray-600 uppercase tracking-wider font-medium">{label}</p>
      </div>
    </div>
  );

  const TicketTable = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket #</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredTickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer">
                <td className="py-4 px-4 text-sm font-medium text-gray-900">
                  #{ticket.ticket_number}
                </td>
                <td className="py-4 px-4">
                  <p className="font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.description}</p>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                    {formatText(ticket.status)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                    {formatText(ticket.priority)}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-500">
                  {formatDate(ticket.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        <div className="p-3 space-y-3">
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-all duration-200">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">#{ticket.ticket_number} - {ticket.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(ticket.created_at)}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ml-2 flex-shrink-0 ${getStatusColor(ticket.status)}`}>
                  {formatText(ticket.status).split(' ')[0]}
                </span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {formatText(ticket.priority)}
                </span>
                <span className="text-xs text-gray-400">
                  {ticket.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const TicketsSection = () => {
    if (loading) return (
      <div className="flex items-center justify-center p-6 sm:p-8 gap-3 text-gray-500">
        <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
        <span className="text-sm sm:text-base">Loading Tickets...</span>
      </div>
    );

    if (error) return (
      <div className="p-6 sm:p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <p className="text-red-600 mb-4 font-medium text-sm sm:text-base">{error}</p>
        <button 
          onClick={fetchTickets} 
          className="px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] transition-colors duration-200 text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );

    if (filteredTickets.length === 0) {
      const hasFilters = searchQuery || statusFilter !== "all";
      return (
        <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center text-gray-500">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-100 mb-4">
            <Inbox className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
            {hasFilters ? "No Matching Tickets" : "No Tickets Yet"}
          </h3>
          <p className="text-xs sm:text-sm mb-4 max-w-sm">
            {hasFilters ? "Try adjusting your search or filter criteria" : "You haven't submitted any support tickets yet"}
          </p>
          {!hasFilters && (
            <button 
              onClick={() => setShowCreateTicket(true)}
              className="text-sm text-[#5483B3] hover:text-[#476a8a] font-medium flex items-center transition-colors duration-200"
            >
              <Plus className="w-4 h-4 mr-1" />
              Submit Your First Ticket
            </button>
          )}
        </div>
      );
    }

    return <TicketTable />;
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Manage your support tickets and requests.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Tickets" value={userTickets.length} />
              <StatCard label="Open Tickets" value={userTickets.filter(t => t.status === "open" || t.status === "in_progress").length} />
              <StatCard label="Resolved" value={userTickets.filter(t => t.status === "resolved" || t.status === "closed").length} />
              <StatCard label="High Priority" value={userTickets.filter(t => t.priority === "high" || t.priority === "critical").length} />
            </div>

            {/* Tickets Section */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* Mobile Filter Toggle */}
                    <div className="sm:hidden">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                      </button>
                    </div>

                    {/* Search and Filters */}
                    <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 ${showFilters ? 'flex' : 'hidden sm:flex'}`}>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full sm:w-48 pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] appearance-none transition-colors duration-200"
                        >
                          <option value="all">All Status</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                      <button
                        onClick={() => setShowCreateTicket(true)}
                        className="bg-[#5483B3] hover:bg-[#476a8a] text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">New Ticket</span>
                        <span className="sm:hidden">Create</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets Content */}
              <div className="p-4 sm:p-6">
                <TicketsSection />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <CreateTicket
              currentUser={currentUser}
              currentUserRole={currentUser.role}
              onTicketCreate={handleTicketCreate}
              onCancel={() => setShowCreateTicket(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default UserDashboard;