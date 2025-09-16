import React, { useState, useEffect, useMemo } from "react";
import { 
  Filter, 
  ChevronDown, 
  Loader2, 
  Inbox, 
  User, 
  AlertCircle,
  Calendar,
  Ticket as TicketIcon,
  AlertTriangle,
  Search
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import TicketDetails from "../TicketDetails";

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
  estimatedTime?: string;
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
            image_url,
            estimated_time
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
            image_url: t.image_url || "",
            estimatedTime: t.estimated_time || "Not specified"
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
      case "open": return "text-blue-700 bg-blue-100 border-blue-200";
      case "in_progress": return "text-amber-700 bg-amber-100 border-amber-200";
      case "resolved": return "text-green-700 bg-green-100 border-green-200";
      case "closed": return "text-gray-700 bg-gray-100 border-gray-200";
      default: return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    // Convert to lowercase to match the dashboard style
    const priorityLower = priority.toLowerCase();
    switch (priorityLower) {
      case "critical": return "text-red-700 bg-red-100";
      case "high": return "text-orange-700 bg-orange-100";
      case "medium": return "text-yellow-700 bg-yellow-100";
      case "low": return "text-green-700 bg-green-100";
      default: return "text-gray-700 bg-gray-100";
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
      className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => setSelectedTicket(ticket)}
    >
      {/* Ticket Number and Status */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center">
          <TicketIcon className="w-4 h-4 text-gray-500 mr-2" />
          <span className="text-sm font-medium text-gray-700">#{ticket.ticket_number}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(ticket.status)}`}>
          {ticket.status.replace("_", " ").toUpperCase()}
        </span>
      </div>
      
      {/* Title with heading */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Title</p>
        <h4 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
          {ticket.title}
        </h4>
      </div>
      
      {/* Description with heading */}
      <div className="mb-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Description</p>
        <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
      </div>
      
      {/* Priority and Date in a grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
            <AlertTriangle className="w-3 h-3 mr-1" /> Priority
          </p>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
            {ticket.priority.toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
            <Calendar className="w-3 h-3 mr-1" /> Created
          </p>
          <span className="text-xs text-gray-500">{formatDate(ticket.created_at)}</span>
        </div>
      </div>

      {/* Requester and Assignee */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
            <User className="w-3 h-3 mr-1" /> Requester
          </p>
          <span className="text-xs text-gray-700">{ticket.requester_name}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center">
            <User className="w-3 h-3 mr-1" /> Assignee
          </p>
          <span className="text-xs text-gray-700">{ticket.assignee || "Unassigned"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
            />
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 bg-white"
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {/* New Ticket */}
          <button
            onClick={onOpenCreateTicket}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            New Ticket
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && !error && (
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredTickets.length} of {tickets.length} tickets
          </p>
          {(searchQuery || statusFilter !== "all" || priorityFilter !== "all" || dateFilter !== "all") && (
            <button 
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setDateFilter("all");
                setSearchQuery("");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Tickets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-sm border border-gray-200">
          <Inbox className="w-16 h-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters or create a new ticket</p>
          <button
            onClick={onOpenCreateTicket}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Ticket
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
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
            image_url: selectedTicket.image_url || "",
            estimatedTime: selectedTicket.estimatedTime || "Not specified"
          }}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          currentUserRole="user" // You might want to pass the actual role here
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            // Refresh tickets when updated
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default MyTickets;