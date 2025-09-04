// src/components/user/UserDashboard.tsx
import React, { useState, useEffect, useCallback } from "react";
import ProfileSettings from "./ProfileSetting";
import { 
  Ticket as TicketIcon, Clock, CheckCircle, AlertTriangle, Loader2, Inbox
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Ticket } from "../../types";

interface UserDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState("dashboard");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          ticket_number,
          created_at,
          updated_at,
          title,
          description,
          type,
          priority,
          status,
          category,
          assignee:assignee_id(full_name),
          requester:requester_id(full_name)
        `)
        .eq("requester_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedTickets: Ticket[] = data.map(ticket => ({
          numeric_id: ticket.id,
          id: ticket.ticket_number || `${ticket.type === "incident" ? "INC" : "SR"}-${String(ticket.id).slice(-6).padStart(6, "0")}`,
          title: ticket.title,
          description: ticket.description,
          type: ticket.type,
          priority: ticket.priority,
          status: ticket.status,
          category: ticket.category,
          assignee: ticket.assignee ? ticket.assignee.full_name : "Unassigned",
          requester: ticket.requester ? ticket.requester.full_name : currentUser.name,
          createdAt: new Date(ticket.created_at),
          updatedAt: new Date(ticket.updated_at),
        }));
        setUserTickets(formattedTickets);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setError("Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, currentUser.name]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpdateProfile = (updatedUser: { name: string; email: string }) => {
    console.log("Profile updated:", updatedUser);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "text-blue-700 bg-blue-50";
      case "in_progress": return "text-orange-700 bg-orange-50";
      case "resolved": return "text-green-700 bg-green-50";
      case "closed": return "text-gray-700 bg-gray-50";
      default: return "text-gray-700 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-red-700 bg-red-50";
      case "high": return "text-orange-700 bg-orange-50";
      case "medium": return "text-yellow-700 bg-yellow-50";
      case "low": return "text-green-700 bg-green-50";
      default: return "text-gray-700 bg-gray-50";
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const StatCard = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>, label: string, value: number }) => (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </div>
  );

  const RecentTicketsCard = () => {
    const recentTickets = userTickets.slice(0, 5);

    if (loading) return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
        <p className="ml-2 text-gray-500">Loading tickets...</p>
      </div>
    );

    if (error) return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchTickets} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Try Again</button>
      </div>
    );

    if (recentTickets.length === 0) return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Inbox className="w-10 h-10 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets yet</h3>
        <p className="text-sm text-gray-500 mb-4">You don't have any tickets yet</p>
      </div>
    );

    return (
      <div className="space-y-3">
        {recentTickets.map(ticket => (
          <div key={ticket.id} className="bg-white p-4 rounded-lg border border-gray-200">
            {/* Removed clickable/open behavior */}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-gray-900 truncate">{ticket.title}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>{formatDate(ticket.createdAt)}</span>
                    <span>•</span>
                    <span>{ticket.assignee}</span>
                  </div>
                  <span className={`px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>{ticket.status.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const DashboardHeader = () => (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-600">Welcome back, {currentUser.name}</p>
    </div>
  );

  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard": return (
        <div className="space-y-6">
          <DashboardHeader />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={TicketIcon} label="Total Tickets" value={userTickets.length} />
            <StatCard icon={Clock} label="Open Tickets" value={userTickets.filter(t => t.status === "open" || t.status === "in_progress").length} />
            <StatCard icon={CheckCircle} label="Resolved" value={userTickets.filter(t => t.status === "resolved" || t.status === "closed").length} />
            <StatCard icon={AlertTriangle} label="High Priority" value={userTickets.filter(t => t.priority === "high" || t.priority === "critical").length} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
            </div>
            <div className="p-6"><RecentTicketsCard /></div>
          </div>
        </div>
      );

      case "profile_settings": return <ProfileSettings currentUser={currentUser} onUpdate={handleUpdateProfile} />;

      default: return (
        <div className="text-center py-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-gray-500 mb-4">The requested page doesn't exist.</p>
          <button onClick={() => setActiveView("dashboard")} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
            Back to Dashboard
          </button>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {renderActiveView()}
    </div>
  );
};

export default UserDashboard;
