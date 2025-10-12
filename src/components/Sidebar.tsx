import React, { useState } from 'react';
import { 
  Home, Ticket, Calendar, Megaphone, Users, BarChart3, 
  Bot, MessageSquare, Settings, List, ClipboardList, Wrench, Plus, User, LogOut, Menu, X 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../assets/Logo.png';

// Sidebar link component
const SidebarLink = ({ to, icon, text, active, onClick, action, mobile }: any) => {
  if (action) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left group ${
          active 
            ? 'bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] text-white shadow-lg' 
            : 'text-gray-700 hover:bg-[#F0F5FC] hover:text-[#5483B3]'
        } ${mobile ? 'text-base' : ''}`}
      >
        <div className={`transition-transform duration-200 group-hover:scale-110 ${
          active ? 'text-white' : 'text-[#5483B3]'
        }`}>
          {icon}
        </div>
        <span className="font-medium">{text}</span>
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] text-white shadow-lg' 
          : 'text-gray-700 hover:bg-[#F0F5FC] hover:text-[#5483B3]'
      } ${mobile ? 'text-base' : ''}`}
    >
      <div className={`transition-transform duration-200 group-hover:scale-110 ${
        active ? 'text-white' : 'text-[#5483B3]'
      }`}>
        {icon}
      </div>
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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Menu configuration with route paths
  const menuConfig: Record<string, MenuItem[]> = {
    admin: [
      { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
      { id: 'tickets', label: 'Tickets', icon: <Ticket size={20} />, path: '/tickets' },
      { id: 'user-management', label: 'User Management', icon: <Users size={20} />, path: '/admin/users' },
      { id: 'agents', label: 'Agents', icon: <Users size={20} />, path: '/agents' },
      { id: 'scheduler', label: 'Scheduler', icon: <Calendar size={20} />, path: '/scheduler' },
      { id: 'announcements', label: 'Announcements', icon: <Megaphone size={20} />, path: '/announcements' },
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
      { id: "profile_settings", label: "Settings", icon: <User size={20} />, path: '/profile-settings' },
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

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src={Logo} 
            alt="Hapo Desk Logo" 
            className="w-8 h-8" 
          />
          <span className="text-lg font-bold text-gray-900">Hapo Desk</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col h-screen fixed top-0 left-0 z-40 shadow-lg">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200 bg-white">
          <Link 
            to="/dashboard" 
            className="flex items-center space-x-3 group"
          >
            <img 
              src={Logo} 
              alt="Hapo Desk Logo" 
              className="w-10 h-10 transition-transform duration-200 group-hover:scale-110" 
            />
            <span className="text-xl font-bold text-gray-900 group-hover:text-[#5483B3] transition-all duration-200">
              Hapo Desk
            </span>
          </Link>
        </div>
        
        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-6 bg-white">
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

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full text-left text-gray-700 hover:bg-red-50 hover:text-red-600 group"
          >
            <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-white z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Navigation Links */}
        <div className="p-4 space-y-2">
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
                setIsMobileOpen(false);
              }}
              action={item.action}
              mobile={true}
            />
          ))}
        </div>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <button
            onClick={() => {
              logout();
              setIsMobileOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 w-full text-left text-gray-700 hover:bg-red-50 hover:text-red-600 group"
          >
            <LogOut size={20} className="transition-transform duration-200 group-hover:scale-110" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  );
};

export default Sidebar;