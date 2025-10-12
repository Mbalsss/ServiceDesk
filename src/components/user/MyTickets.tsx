import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import TicketDetails from "./TicketDetails";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  assignee?: string;
  ticket_number: string;
  type: string;
  category: string;
  requester: string;
  updated_at: string;
  requester_name: string;
  image_url?: string;
}

interface MyTicketsProps {
  onOpenCreateTicket: () => void;
  currentUser: { id: string; name: string; email: string };
}

const MyTickets: React.FC<MyTicketsProps> = ({ onOpenCreateTicket, currentUser }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Common Tailwind classes for inputs and selects
  const formControlClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] bg-white shadow-sm transition-all duration-200";

  // Fetch tickets
  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            id,
            title,
            description,
            priority,
            status,
            created_at,
            updated_at,
            assignee:assignee_id(full_name),
            ticket_number,
            type,
            category,
            requester:requester_id(full_name),
            image_url
          `)
          .order("created_at", { ascending: false });

        if (error) {
          setError(error.message);
          console.error("Supabase error:", error);
        } else if (data) {
          const formattedTickets: Ticket[] = data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            status: t.status,
            created_at: t.created_at,
            updated_at: t.updated_at,
            assignee: t.assignee?.full_name || "Unassigned",
            ticket_number: t.ticket_number,
            type: t.type || "issue",
            category: t.category || "general",
            requester: t.requester?.full_name || "Unknown",
            requester_name: t.requester?.full_name || "Unknown",
            image_url: t.image_url || ""
          }));
          setTickets(formattedTickets);
        }
      } catch (err) {
        setError("Failed to fetch tickets");
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  // Date helpers
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isThisWeek = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    return date >= startOfWeek && date < endOfWeek;
  };

  const isThisMonth = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Filter tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch = searchQuery === "" || 
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || 
        (priorityFilter === "Critical" && ticket.priority === "Critical") ||
        (priorityFilter === "High" && ticket.priority === "High") ||
        (priorityFilter === "Medium" && ticket.priority === "Medium") ||
        (priorityFilter === "Low" && ticket.priority === "Low");
      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "today" && isToday(ticket.created_at)) ||
        (dateFilter === "week" && isThisWeek(ticket.created_at)) ||
        (dateFilter === "month" && isThisMonth(ticket.created_at));

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });
  }, [tickets, statusFilter, priorityFilter, dateFilter, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": 
        return "text-blue-700 bg-blue-50 border border-blue-200";
      case "in_progress": 
        return "text-amber-700 bg-amber-50 border border-amber-200";
      case "resolved": 
        return "text-emerald-700 bg-emerald-50 border border-emerald-200";
      case "closed": 
        return "text-gray-700 bg-gray-50 border border-gray-200";
      default: 
        return "text-gray-700 bg-gray-50 border border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case "critical": 
        return "text-red-700 bg-red-50 border border-red-200";
      case "high": 
        return "text-orange-700 bg-orange-50 border border-orange-200";
      case "medium": 
        return "text-yellow-700 bg-yellow-50 border border-yellow-200";
      case "low": 
        return "text-green-700 bg-green-50 border border-green-200";
      default: 
        return "text-gray-700 bg-gray-50 border border-gray-200";
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

  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div 
      className="bg-white p-4 sm:p-5 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:border-[#5483B3]"
      onClick={() => setSelectedTicket(ticket)}
    >
      {/* Ticket Number and Status */}
      <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-700">#{ticket.ticket_number}</span>
        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
          <span className="hidden sm:inline">
            {ticket.status.replace(/_/g, " ").toUpperCase()}
          </span>
          <span className="sm:hidden">
            {ticket.status.split('_')[0].toUpperCase()}
          </span>
        </span>
      </div>
      
      {/* Title with heading */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</p>
        <h4 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight group-hover:text-[#5483B3] transition-colors duration-200 line-clamp-2">
          {ticket.title}
        </h4>
      </div>
      
      {/* Description with heading */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{ticket.description}</p>
      </div>
      
      {/* Priority and Date in a grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Priority</p>
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
            <span className="hidden sm:inline">
              {ticket.priority.toUpperCase()}
            </span>
            <span className="sm:hidden">
              {ticket.priority.charAt(0).toUpperCase()}
            </span>
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Created</p>
          <span className="text-xs font-medium text-gray-600">
            {formatDate(ticket.created_at)}
          </span>
        </div>
      </div>

      {/* Requester and Assignee */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Requester</p>
          <span className="text-xs font-medium text-gray-700 truncate block">
            {ticket.requester_name}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Assignee</p>
          <span className={`text-xs font-medium truncate block ${
            ticket.assignee && ticket.assignee !== "Unassigned" 
              ? "text-gray-700" 
              : "text-gray-500 italic"
          }`}>
            {ticket.assignee || "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Tickets</h1>
            <p className="text-gray-600 mt-1 text-sm">Manage and track all your support tickets</p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            {/* Search Input with Icon */}
            <div className="relative w-full sm:w-48 lg:w-64">
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${formControlClasses}`}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Mobile Filters Toggle */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white shadow-sm transition-colors duration-200 text-sm font-medium text-gray-700 w-full"
              >
                <span>Filters</span>
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* New Ticket */}
            <button
              onClick={onOpenCreateTicket}
              className="px-4 py-2.5 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] font-medium shadow-sm transition-colors duration-200 w-full sm:w-auto text-sm"
            >
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">Create Ticket</span>
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="p-4 sm:p-6">
            {/* Desktop Filter Header */}
            <div className="hidden sm:flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hide
              </button>
            </div>

            {/* Mobile Filter Header */}
            <div className="sm:hidden flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-[#5483B3] hover:text-[#476a8a] font-medium"
              >
                Done
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={formControlClasses}
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className={formControlClasses}
                >
                  <option value="all">All Priorities</option>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className={formControlClasses}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-sm font-medium text-gray-700">
              Showing <span className="font-semibold">{filteredTickets.length}</span> of{" "}
              <span className="font-semibold">{tickets.length}</span> tickets
            </p>
            {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all") && (
              <button 
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setDateFilter("all");
                  setSearchQuery("");
                }}
                className="text-sm text-[#5483B3] hover:text-[#476a8a] font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Tickets */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-8 sm:h-12 w-8 sm:w-12 border-b-2 border-[#5483B3] mb-3 sm:mb-4"></div>
            <p className="text-gray-700 font-medium text-sm sm:text-base">Loading your tickets...</p>
          </div>
        ) : error ? (
          <div className="p-6 sm:p-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load tickets</h3>
            <p className="text-red-600 mb-4 sm:mb-6 text-sm sm:text-base">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 sm:px-6 py-2.5 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] font-medium transition-colors duration-200 text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-16 text-center bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">No tickets found</h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all" 
                ? "Try adjusting your search or filters to find what you're looking for."
                : "You haven't created any tickets yet. Start by creating your first ticket!"}
            </p>
            <button
              onClick={onOpenCreateTicket}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] font-medium transition-colors duration-200 text-sm sm:text-base"
            >
              Create New Ticket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <TicketDetails 
                ticket={{
                  id: selectedTicket.id,
                  title: selectedTicket.title,
                  description: selectedTicket.description,
                  priority: selectedTicket.priority.toLowerCase(),
                  status: selectedTicket.status,
                  created_at: selectedTicket.created_at,
                  updated_at: selectedTicket.updated_at,
                  ticket_number: selectedTicket.ticket_number,
                  type: selectedTicket.type,
                  category: selectedTicket.category,
                  requester_name: selectedTicket.requester_name,
                  image_url: selectedTicket.image_url || ""
                }}
                currentUserId={currentUser.id}
                currentUserName={currentUser.name}
                currentUserRole="user"
                onClose={() => setSelectedTicket(null)}
                onUpdate={() => {
                  window.location.reload();
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;