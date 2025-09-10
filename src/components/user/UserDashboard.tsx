import React, { useState, useEffect, useCallback } from "react";
import UserLayout from "./UserLayout";
import ProfileSettings from "./ProfileSetting";
import { supabase } from "../../lib/supabase";
import { Ticket } from "../../types";
import { Loader2, Inbox, Ticket as TicketIcon, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface UserDashboardProps {
  currentUser: { id: string; name: string; email: string; role: string };
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ currentUser, onLogout }) => {
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"dashboard" | "profile_settings">("dashboard");

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setLoading(true);
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
    }
  }, [currentUser.id]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const handleUpdateProfile = (updatedUser: { name: string; email: string }) => {
    console.log("Profile updated:", updatedUser);
  };

  // Utility functions for styling
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

  // Dashboard Stat Card
  const StatCard = ({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>, label: string, value: number }) => (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
    </div>
  );

  // Recent Tickets as cards
  const RecentTicketsCard = () => {
    const recentTickets = userTickets.slice(0, 5);

    if (loading) return (
      <div className="flex items-center justify-center p-8 gap-2 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading tickets...</span>
      </div>
    );

    if (error) return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchTickets} className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">Try Again</button>
      </div>
    );

    if (recentTickets.length === 0) return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
        <Inbox className="w-12 h-12 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tickets yet</h3>
        <p className="text-sm">You don't have any tickets yet</p>
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentTickets.map(ticket => (
          <div
            key={ticket.id}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-gray-900 text-lg truncate">{ticket.title}</h4>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-gray-600 text-sm line-clamp-3 mb-4">{ticket.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{formatDate(new Date(ticket.created_at))}</span>
              <span className={`px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>{ticket.status.replace("_", " ")}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render active view
  const renderActiveView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Tickets</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard icon={TicketIcon} label="Total Tickets" value={userTickets.length} />
              <StatCard icon={Clock} label="Open Tickets" value={userTickets.filter(t => t.status === "open" || t.status === "in_progress").length} />
              <StatCard icon={CheckCircle} label="Resolved" value={userTickets.filter(t => t.status === "resolved" || t.status === "closed").length} />
              <StatCard icon={AlertTriangle} label="High Priority" value={userTickets.filter(t => t.priority === "high" || t.priority === "critical").length} />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
              </div>
              <div className="p-6"><RecentTicketsCard /></div>
            </div>
          </div>
        );
      case "profile_settings":
        return <ProfileSettings currentUser={currentUser} onUpdate={handleUpdateProfile} />;
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
    >
      {renderActiveView()}
    </UserLayout>
  );
};

export default UserDashboard;
