// src/components/technician/TicketsPage.tsx
import React, { useState } from "react";
import Layout from "./Layout";
import AssignedTickets from "./AssignedTickets";
import UnassignedTicketsQueue from "./UnassignedTicketsQueue";
import TicketDetails from "../TicketDetails";

interface CurrentUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface TicketType {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  category: string;
  status: string;
  requester_id: string;
  assignee_id: string | null;
  requester_name?: string;
  assignee_name?: string;
  estimatedTime?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  sla_deadline?: string;
  internal_comments?: CommentType[];
}

interface CommentType {
  id: string;
  ticket_id: string;
  technician_id: string;
  technician_name: string;
  comment: string;
  created_at: string;
}

const TicketsPage: React.FC<{ currentUser: CurrentUser }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"assigned" | "unassigned">("assigned");
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const handleTicketTaken = () => setRefreshFlag(prev => !prev);

  return (
    <Layout 
      currentUser={currentUser} 
      notificationsCount={5} 
      title="Tickets Dashboard"
      subtitle="Manage assigned and unassigned tickets"
    >
      <div className="space-y-6">
        {/* Tabs with improved styling and mobile responsiveness */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("assigned")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "assigned"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Assigned Tickets
            </button>
            <button
              onClick={() => setActiveTab("unassigned")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === "unassigned"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Unassigned Tickets
            </button>
          </nav>
        </div>

        {/* Tickets List Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {activeTab === "assigned" && (
            <AssignedTickets
              key={refreshFlag.toString()}
              currentUser={currentUser}
              onViewTicket={(ticket) => setSelectedTicket(ticket)}
            />
          )}

          {activeTab === "unassigned" && (
            <UnassignedTicketsQueue
              key={refreshFlag.toString()}
              currentUser={currentUser}
              onTicketTaken={handleTicketTaken}
              onViewTicket={(ticket) => setSelectedTicket(ticket)}
            />
          )}
        </div>

        {/* Improved Ticket Details Modal */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setSelectedTicket(null)}></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <TicketDetails
                    ticket={selectedTicket}
                    currentUserId={currentUser.id}
                    onClose={() => setSelectedTicket(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TicketsPage;