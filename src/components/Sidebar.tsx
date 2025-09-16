import React from 'react';
import { 
  Home, Ticket, Calendar, Megaphone, Users, BarChart3, 
  Bot, MessageSquare, Settings, List, ClipboardList, Wrench, Plus, User, LogOut, HelpCircle 
} from 'lucide-react';

// Sidebar link component with updated styling
const SidebarLink = ({ icon, text, active, onClick }: any) => (
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
  // Menu configuration
  const menuConfig: Record<string, any[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} /> },
      { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} /> },
      { id: 'scheduler', label: 'Scheduler', icon: <Calendar size={20} /> },
      { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} /> },
      { id: 'agents', label: 'Agents', icon: <Users size={20} /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
      { id: 'copilot', label: 'Copilot Assistant', icon: <Bot size={20} /> },
      { id: 'teams', label: 'Teams Integration', icon: <MessageSquare size={20} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ],
    technician: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
      { id: "ticketsPage", label: "Tickets", icon: <List size={20} /> },
      { id: "field_report", label: "Field Reports", icon: <ClipboardList size={20} /> },
      // For technicians - use regular chat support instead of Teams
      { id: "team_chat", label: "Team Chat", icon: <Users size={20} />, action: () => setChatOpen?.(true) },
      { id: "scheduler", label: "Schedule", icon: <Calendar size={20} /> },
      { id: "equipment", label: "Equipment", icon: <Wrench size={20} /> },
      { id: "knowledge_base", label: "Knowledge Base", icon: <HelpCircle size={20} /> },
    ],
    user: [
      { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
      { id: "my_tickets", label: "My Tickets", icon: <List size={20} /> },
      { id: "create", label: "Create Ticket", icon: <Plus size={20} />, action: onOpenCreateTicket },
      // For users - use regular chat support instead of Teams
      { id: "chat_support", label: "Chat with Support", icon: <MessageSquare size={20} />, action: () => setChatOpen?.(true) },
      { id: "profile_settings", label: "Settings", icon: <User size={20} /> },
    ],
  };

  const links = menuConfig[currentUser.role] || [];

  // Debug function to check what's happening
  const handleChatSupportClick = () => {
    console.log('Chat support clicked');
    console.log('setChatOpen function available:', !!setChatOpen);
    console.log('setTeamsChatOpen function available:', !!setTeamsChatOpen);
    
    if (setChatOpen) {
      setChatOpen(true);
    } else {
      console.warn('setChatOpen function is not available');
    }
  };

  return (
    <div className="w-64 bg-white border-r flex flex-col h-full sticky top-0">
      <div className="p-4 border-b">
        <div className="text-2xl font-bold text-gray-800">
          IT Support Portal
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-2 px-4">
          {links.map((item) => (
            <SidebarLink
              key={item.id}
              icon={item.icon}
              text={item.label}
              active={activeView === item.id}
              onClick={(e) => {
                e.preventDefault();
                console.log(`Clicked: ${item.label}`, item.action);
                
                if (item.action) {
                  item.action();
                } else {
                  onViewChange(item.id);
                }
              }}
            />
          ))}
        </nav>
      </div>

      <div className="p-4 border-t">
        <SidebarLink 
          icon={<LogOut size={20} />} 
          text="Logout" 
          active={false} 
          onClick={(e) => { 
            e.preventDefault(); 
            logout(); 
          }} 
        />
      </div>
    </div>
  );
};

export default Sidebar;