import React, { useState } from 'react';
import UnassignedTicketsQueue from './UnassignedTicketsQueue';
import AssignedTickets from './AssignedTickets';

interface TicketsSectionProps {
  currentUser: { id: string; name: string; email: string; role: string };
}

const TicketsSection: React.FC<TicketsSectionProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      {/* Section title */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Tickets</h2>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('unassigned')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'unassigned'
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Unassigned
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`px-4 py-2 font-medium rounded-t-lg ${
            activeTab === 'assigned'
              ? 'bg-white shadow text-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Assigned
        </button>
      </div>

      {/* Active tab content */}
      <div>
        {activeTab === 'unassigned' && (
          <UnassignedTicketsQueue
            currentUser={currentUser}
            onTicketTaken={() => console.log('Ticket taken')}
            onViewTicket={(ticket) => console.log('View ticket', ticket)}
          />
        )}
        {activeTab === 'assigned' && (
          <AssignedTickets
            currentUser={currentUser}
            onViewTicket={(ticket) => console.log('View ticket', ticket)}
          />
        )}
      </div>
    </div>
  );
};

export default TicketsSection;
