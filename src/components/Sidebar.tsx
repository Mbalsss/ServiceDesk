import React from 'react';
import { Home, Ticket, Plus, Users, BarChart3, Settings, MessageSquare, Zap, Calendar, Clock, CheckSquare, Megaphone, Activity, AlertTriangle, Bot } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tickets', label: 'All Tickets', icon: Ticket },
    { id: 'create', label: 'Create Ticket', icon: Plus },
    { id: 'chatbot', label: 'ChatBot', icon: MessageSquare },
    { id: 'major-incidents', label: 'Major Incidents', icon: AlertTriangle },
    { id: 'scheduler', label: 'Scheduler', icon: Calendar },
    { id: 'tech-availability', label: 'Tech Availability', icon: Activity },
    { id: 'field-report', label: 'Field Reports', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'reminders', label: 'Reminders', icon: Clock },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'agents', label: 'Agents', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'copilot', label: 'Copilot Assistant', icon: Bot },
    { id: 'teams', label: 'Teams Integration', icon: MessageSquare },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
