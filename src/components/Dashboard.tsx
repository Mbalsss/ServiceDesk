import React from 'react';
import { Ticket, Clock, Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import { Ticket as TicketType, DashboardStats } from '../types';

interface DashboardProps {
  stats: DashboardStats;
  recentTickets: TicketType[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, recentTickets }) => {
  
  const getPriorityPillColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const cardData = [
    { title: 'Total Tickets', value: stats.totalTickets, icon: Ticket, color: 'blue' },
    { title: 'Open Tickets', value: stats.openTickets, icon: Clock, color: 'orange' },
    { title: 'In Progress', value: stats.inProgressTickets, icon: Activity, color: 'yellow' },
    { title: 'Critical Incidents', value: stats.criticalTickets, icon: AlertTriangle, color: 'red' }
  ];

  return (
    <div className="p-6 bg-gray-50 h-full space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to your Service Desk dashboard. Here is a real-time overview of system metrics.
        </p>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cardData.map(card => {
          const Icon = card.icon;
          const colorClass = `text-${card.color}-600`;
          const bgClass = `bg-${card.color}-100`;
          
          return (
            <div key={card.title} className="bg-white shadow-sm rounded-lg border border-gray-200 p-5 flex items-center gap-5">
              <div className={`p-3 rounded-lg ${bgClass}`}>
                <Icon className={`w-7 h-7 ${colorClass}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Recent Tickets Section - Fixed the key issue here */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Tickets</h2>
          <p className="text-sm text-gray-500">A summary of the latest tickets created.</p>
        </div>
        <div className="divide-y divide-gray-200">
          {recentTickets.length > 0 ? (
            recentTickets.slice(0, 5).map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-800">{ticket.title}</p>
                  <p className="text-sm text-gray-500">
                    Requested by {ticket.requester}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityPillColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))
          ) : (
            <p key="no-tickets" className="p-4 text-sm text-gray-500">
              No recent tickets to display.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;