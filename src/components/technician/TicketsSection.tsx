import React, { useState, useEffect } from 'react';
import UnassignedTicketsQueue from './UnassignedTicketsQueue';
import AssignedTickets from './AssignedTickets';
import TicketDetails from './TicketDetails';
import PerformanceOverview from './PerformanceOverview';
import { supabase } from '../../lib/supabase';

interface TicketsSectionProps {
  currentUser: { id: string; name: string; email: string; role: string };
}

interface TicketType {
  id: string;
  status: string;
  priority: string;
  assignee_id: string | null;
  requester_id: string;
  sla_deadline?: string;
  title: string;
  description: string;
  category: string;
  type: string;
  created_at: string;
  updated_at: string;
}

const TicketsSection: React.FC<TicketsSectionProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'unassigned' | 'assigned'>('unassigned');
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all tickets from Supabase
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let visibleTickets = data || [];
      if (currentUser.role !== 'admin') {
        visibleTickets = visibleTickets.filter(
          t => t.assignee_id === currentUser.id || t.requester_id === currentUser.id
        );
      }

      setTickets(visibleTickets);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleTicketTaken = () => {
    fetchTickets(); // Refresh tickets whenever one is taken
  };

  if (selectedTicket) {
    return (
      <TicketDetails
        ticket={selectedTicket}
        currentUser={currentUser}
        onBack={() => setSelectedTicket(null)}
      />
    );
  }

  // Separate assigned and unassigned tickets for tabs
  const assignedTickets = tickets.filter(t => t.assignee_id === currentUser.id);
  const unassignedTickets = tickets.filter(t => !t.assignee_id);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Tickets Dashboard</h2>

      {/* Performance Overview */}
      <PerformanceOverview currentUser={currentUser} />

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

      {/* Active Tab Content */}
      <div>
        {activeTab === 'unassigned' && (
          <UnassignedTicketsQueue
            currentUser={currentUser}
            onTicketTaken={handleTicketTaken}
            onViewTicket={ticket => setSelectedTicket(ticket)}
          />
        )}
        {activeTab === 'assigned' && (
          <AssignedTickets
            currentUser={currentUser}
            onViewTicket={ticket => setSelectedTicket(ticket)}
          />
        )}
      </div>
    </div>
  );
};

export default TicketsSection;
