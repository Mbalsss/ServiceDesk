import React, { useState, useEffect, useCallback } from "react";
import UserLayout from "../technician/Layout";
import ProfileSettings from "./ProfileSetting";
import { supabase } from "../../lib/supabase";
import { Ticket } from "../../types";
import { 
  Loader2, 
  Inbox, 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  User,
  Settings,
  Grid,
  List,
  Search,
  Filter,
  Plus,
  Eye
} from "lucide-react";

interface UserDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "profile_settings">("dashboard");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch tickets
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
    if (activeView === "dashboard") {
      fetchTickets();
    }
  }, [fetchTickets, activeView]);

  const handleUpdateProfile = (updatedUser: { name: string; email: string }) => {
    console.log("Profile updated:", updatedUser);
  };

  // Filter tickets based on search and filter criteria
  const filteredTickets = userTickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Utility functions for styling
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
    switch (priority) {
      case "critical": return "text-red-700 bg-red-100";
      case "high": return "text-orange-700 bg-orange-100";
      case "medium": return "text-yellow-700 bg-yellow-100";
      case "low": return "text-green-700 bg-green-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      default: return <TicketIcon className="w-4 h-4" />;
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

  // Dashboard Stat Card (Modified)
  const StatCard = ({ 
    label, 
    value, 
  }: { 
    label: string; 
    value: number;
  }) => (
    <div className="p-5 rounded-xl border border-gray-200 flex flex-col justify-between bg-white">
      <div>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  );

  // Ticket Card Component
  const TicketCard = ({ ticket }: { ticket: Ticket }) => (
    <div className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-semibold text-gray-900 text-lg truncate group-hover:text-blue-600 transition-colors">
          {ticket.title}
        </h4>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority}
        </span>
      </div>
      <p className="text-gray-600 text-sm line-clamp-2 mb-4">{ticket.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          {getStatusIcon(ticket.status)}
          <span className={`ml-1 px-2 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>
        <span>{formatDate(ticket.created_at)}</span>
      </div>
    </div>
  );

  // Ticket List Component
  const TicketList = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredTickets.map(ticket => (
            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4">
                <div>
                  <p className="font-medium text-gray-900">{ticket.title}</p>
                  <p className="text-sm text-gray-500 truncate max-w-xs">{ticket.description}</p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                </span>
              </td>
              <td className="py-4 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </td>
              <td className="py-4 px-4 text-sm text-gray-500">
                {formatDate(ticket.created_at)}
              </td>
              <td className="py-4 px-4">
                <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
                  <Eye className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Tickets Section
  const TicketsSection = () => {
    if (loading) return (
      <div className="flex items-center justify-center p-8 gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading tickets...</span>
      </div>
    );

    if (error) return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-red-600 mb-4 font-medium">{error}</p>
        <button 
          onClick={fetchTickets} 
          className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );

    if (filteredTickets.length === 0) {
      const hasFilters = searchQuery || statusFilter !== "all";
      
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {hasFilters ? "No matching tickets" : "No tickets yet"}
          </h3>
          <p className="text-sm mb-4">
            {hasFilters 
              ? "Try adjusting your search or filter criteria" 
              : "You haven't submitted any support tickets yet"}
          </p>
          {!hasFilters && (
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
              <Plus className="w-4 h-4 mr-1" />
              Submit your first ticket
            </button>
          )}
        </div>
      );
    }

    return (
      <>
        {viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTickets.map(ticket => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        ) : (
          <TicketList />
        )}
      </>
    );
  };

  // Render active view
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard label="Total Tickets" value={userTickets.length} />
                <StatCard label="Open Tickets" value={userTickets.filter(t => t.status === "open" || t.status === "in_progress").length} />
                <StatCard label="Resolved" value={userTickets.filter(t => t.status === "resolved" || t.status === "closed").length} />
                <StatCard label="High Priority" value={userTickets.filter(t => t.priority === "high" || t.priority === "critical").length} />
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Tickets</h2>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tickets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div className="relative">
                        <Filter className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        >
                          <option value="all">All Statuses</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewMode("card")}
                        className={`p-2 rounded-lg ${viewMode === "card" ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-2 rounded-lg ${viewMode === "list" ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <TicketsSection />
                </div>
              </div>
            </div>
          </div>
        );
      case "profile_settings":
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <ProfileSettings currentUser={currentUser} onUpdate={handleUpdateProfile} />
          </div>
        );
    }
  };

  return (
    <UserLayout
      currentUser={{ name: currentUser.name, email: currentUser.email }}
      onLogout={onLogout}
      onNavigate={(page) => {
        if (page === "dashboard") setActiveView("dashboard");
        if (page === "profile") setActiveView("profile_settings");
      }}
      activePage={activeView === "dashboard" ? "dashboard" : "profile"}
      title={activeView === "dashboard" ? "Dashboard Overview" : "Profile Settings"}
    >
      {renderActiveView()}
    </UserLayout>
  );
};

export default UserDashboard;