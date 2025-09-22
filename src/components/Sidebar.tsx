import React from 'react';
import { 
  Home, Ticket, Calendar, Megaphone, Users, BarChart3, 
  Bot, MessageSquare, Settings, List, ClipboardList, Wrench, Plus, User, LogOut 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Sidebar link component updated for React Router
const SidebarLink = ({ to, icon, text, active, onClick, action }: any) => {
  if (action) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left ${
          active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        {icon}
        <span className="font-medium">{text}</span>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="font-medium">{text}</span>
    </Link>
  );
};

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
  path?: string;
}

interface SidebarProps {
  currentUser: { role: string };
  activeView: string;
  onViewChange: (view: string) => void;
  logout: () => void;
  onOpenCreateTicket?: () => void;
  setChatOpen?: (open: boolean) => void;
  setTeamsChatOpen?: (open: boolean) => void;
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
  const location = useLocation();

  // Menu configuration with route paths
  const menuConfig: Record<string, MenuItem[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
      { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} />, path: '/tickets' },
      { id: 'scheduler', label: 'Scheduler', icon: <Calendar size={20} />, path: '/scheduler' },
      { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} />, path: '/announcements' },
      { id: 'agents', label: 'Agents', icon: <Users size={20} />, path: '/agents' },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} />, path: '/reports' },
      { id: 'copilot', label: 'Copilot Assistant', icon: <Bot size={20} />, path: '/copilot' },
      { id: 'teams', label: 'Teams Integration', icon: <MessageSquare size={20} />, path: '/teams' },
      { id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
    ],
    technician: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, path: '/dashboard' },
      { id: "ticketsPage", label: "Tickets", icon: <List size={20} />, path: '/ticketpage' },
      { id: "field_report", label: "Field Reports", icon: <ClipboardList size={20} />, path: '/field-report' },
      { id: "scheduler", label: "Schedule", icon: <Calendar size={20} />, path: '/scheduler' },
      { id: "equipment", label: "Equipment", icon: <Wrench size={20} />, path: '/equipment' },
      { id: "performance", label: "Performance", icon: <BarChart3 size={20} />, path: '/performance' },
    ],
    user: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} />, path: '/dashboard' },
      { id: "my_tickets", label: "My Tickets", icon: <List size={20} />, path: '/my-tickets' },
      { id: "create", label: "Create Ticket", icon: <Plus size={20} />, action: onOpenCreateTicket },
      { id: "chat_support", label: "Chat with Support", icon: <MessageSquare size={20} />, action: () => setChatOpen?.(true) },
      { id: "profile_settings", label: "Settings", icon: <User size={20} />, path: '/profile-settings' },
    ],
  };

  const links = menuConfig[currentUser.role] || [];

  return (
    <div className="w-64 bg-white border-r flex flex-col h-screen fixed top-0 left-0 z-50">
      <div className="p-4 border-b">
        <Link to="/dashboard" className="text-2xl font-bold text-gray-800 hover:text-blue-600">
          IT Support Portal
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-2 px-4">
          {links.map((item) => (
            <SidebarLink
              key={item.id}
              to={item.path || '#'}
              icon={item.icon}
              text={item.label}
              active={location.pathname === item.path}
              onClick={(e) => {
                if (item.action) {
                  e.preventDefault();
                  item.action();
                }
              }}
              action={item.action}
            />
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left text-gray-600 hover:bg-gray-100"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
