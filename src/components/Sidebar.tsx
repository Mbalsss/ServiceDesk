import React from 'react';
import { 
  Home, Ticket, Calendar, Megaphone, Users, BarChart3, 
  Bot, MessageSquare, Settings, List, ClipboardList, Wrench, Plus, User, LogOut 
} from 'lucide-react';

interface SidebarLinkProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ icon, text, active = false, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-left
      ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}
    `}
  >
    {icon}
    <span className="font-medium">{text}</span>
  </button>
);

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action?: () => void;
}

interface SidebarProps {
  currentUser: { role: string };
  activeView: string;
  onViewChange: (view: string) => void;
  logout: () => void;
  onOpenCreateTicket?: () => void;
  setChatOpen?: (open: boolean | ((prev: boolean) => boolean)) => void;
  setTeamsChatOpen?: (open: boolean | ((prev: boolean) => boolean)) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeView,
  onViewChange,
  logout,
  onOpenCreateTicket,
  setChatOpen,
  setTeamsChatOpen
}) => {

  const menuConfig: Record<string, MenuItem[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
      { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} /> },
      { id: 'scheduler', label: 'Scheduler', icon: <Calendar size={20} /> },
      { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
      { id: 'agents', label: 'Agents', icon: <Users size={20} /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
      { id: 'copilot', label: 'Copilot Assistant', icon: <Bot size={20} /> },
      { id: 'teams', label: 'Teams Integration', icon: <MessageSquare size={20} />, },
      { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ],
    technician: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
      { id: 'tickets_page', label: 'Tickets', icon: <Ticket size={20} /> },
      { id: 'performance', label: 'Performance', icon: <BarChart3 size={20} /> },
      { id: 'field_report', label: 'Field Reports', icon: <ClipboardList size={20} /> },
      { id: 'scheduler', label: 'Schedule', icon: <Calendar size={20} /> },
      { id: 'equipment', label: 'Equipment', icon: <Wrench size={20} /> },
    ],
    user: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
      { id: 'my_tickets', label: 'My Tickets', icon: <List size={20} /> },
      { id: 'create', label: 'Create Ticket', icon: <Plus size={20} />, action: onOpenCreateTicket },
      { id: 'chat_support', label: 'Chat with Support', icon: <MessageSquare size={20} />, action: () => setChatOpen?.((prev) => !prev) },
      { id: 'profile_settings', label: 'Settings', icon: <User size={20} /> },
    ],
  };

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-full sticky top-0 justify-between">
      {/* Scrollable menu */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
        {menuConfig[currentUser.role]?.map((item) => (
          <SidebarLink
            key={item.id}
            icon={item.icon}
            text={item.label}
            active={activeView === item.id}
            onClick={() => item.action ? item.action() : onViewChange(item.id)}
          />
        ))}
      </div>

      {/* Fixed logout */}
      <div className="p-4 border-t">
        <SidebarLink icon={<LogOut size={20} />} text="Logout" onClick={logout} />
      </div>
    </aside>
  );
};

export default Sidebar;