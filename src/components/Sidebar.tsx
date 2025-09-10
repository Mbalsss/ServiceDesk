import React from 'react';
import {
  Home, Ticket, Calendar, Activity, CheckSquare, Clock, Megaphone,
  Users, BarChart3, Bot, MessageSquare, Settings, List, Search, ClipboardList, HelpCircle, Wrench, Plus, User, LogOut
} from 'lucide-react';

// Sidebar link component
const SidebarLink = ({ icon, text, active, onClick }) => (
  <a
    href="#"
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
      active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span className="font-medium">{text}</span>
  </a>
);

interface SidebarProps {
  currentUser: { role: string };
  activeView: string;
  onViewChange: (view: string) => void;
  logout: () => void;
  onOpenCreateTicket?: () => void; // This is for user role's "Create Ticket"
  setChatOpen?: (open: boolean) => void; // For ServiceDeskChatbot
  setTeamsChatOpen?: (open: boolean) => void; // For TeamsChatWrapper
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  logout,
  onOpenCreateTicket,
  setChatOpen,
  setTeamsChatOpen,
}) => {
  // Menu configuration
  const menuConfig: Record<string, any[]> = {
    admin: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
      { id: "tickets", label: "Tickets", icon: <Ticket size={20} /> },
      { id: "scheduler", label: "Scheduler", icon: <Calendar size={20} /> },
      { id: "tasks", label: "Tasks", icon: <CheckSquare size={20} /> },
      { id: "reminders", label: "Reminders", icon: <Clock size={20} /> },
      { id: "announcements", label: "Announcements", icon: <Megaphone size={20} /> },
      { id: "agents", label: "Agents", icon: <Users size={20} /> },
      { id: "reports", label: "Reports", icon: <BarChart3 size={20} /> },
      { id: "copilot", label: "Copilot Assistant", icon: <Bot size={20} /> },
      { id: "teams", label: "Teams Integration", icon: <MessageSquare size={20} /> },
      { id: "automation", label: "Automation", icon: <Settings size={20} /> },
      { id: "settings", label: "Settings", icon: <Settings size={20} /> },
    ],
    technician: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
      { id: "ticketsPage", label: "Tickets", icon: <List size={20} /> },
      { id: "field_report", label: "Field Reports", icon: <ClipboardList size={20} /> },
      { id: "team_chat", label: "Team Chat", icon: <Users size={20} />, action: () => setTeamsChatOpen?.(true) },
      { id: "scheduler", label: "Schedule", icon: <Calendar size={20} /> },
      { id: "equipment", label: "Equipment", icon: <Wrench size={20} /> },
      { id: "knowledge_base", label: "Knowledge Base", icon: <HelpCircle size={20} /> },
    ],
    user: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
      { id: "my_tickets", label: "My Tickets", icon: <List size={20} /> },
      { id: "create", label: "Create Ticket", icon: <Plus size={20} />, action: onOpenCreateTicket },
      { id: "chat_support", label: "Chat with Support", icon: <MessageSquare size={20} />, action: () => setTeamsChatOpen?.(true) },
      { id: "profile_settings", label: "Settings", icon: <User size={20} /> },
    ],
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col">
      <div className="flex-1">
        {menuConfig[currentUser.role]?.map((item) => (
          <SidebarLink
            key={item.id}
            icon={item.icon}
            text={item.label}
            active={activeView === item.id}
            onClick={(e) => {
              e.preventDefault();
              item.action ? item.action() : onViewChange(item.id);
            }}
          />
        ))}
      </div>
      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 text-gray-600 hover:bg-gray-100 px-4 py-2 rounded-lg w-full"
        >
          <LogOut size={20} /> Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
