// src/components/technician/TicketsPage.tsx
import React, { useState } from "react";
import AssignedTickets from "./AssignedTickets";
import UnassignedTicketsQueue from "./UnassignedTicketsQueue";
import TicketDetails from "../TicketDetails";

interface CurrentUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface CommentType {
  id: string;
  ticket_id: string;
  technician_id: string;
  technician_name: string;
  comment: string;
  created_at: string;
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

const TicketsPage: React.FC<{ currentUser: CurrentUser }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"assigned" | "unassigned">("assigned");
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);

  const refreshTickets = () => setRefreshCounter(prev => prev + 1);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tickets Dashboard</h1>
          <p className="text-gray-600">Manage assigned and unassigned tickets</p>
        </div>

        <div className="space-y-6">
          {/* Tabs */}
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

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {activeTab === "assigned" && (
              <AssignedTickets
                key={refreshCounter}
                currentUser={currentUser}
                onViewTicket={(ticket) => setSelectedTicket(ticket)}
                refreshTrigger={refreshCounter}
              />
            )}

            {activeTab === "unassigned" && (
              <UnassignedTicketsQueue
                key={refreshCounter}
                currentUser={currentUser}
                onTicketTaken={refreshTickets}
                onViewTicket={(ticket) => setSelectedTicket(ticket)}
                refreshTrigger={refreshCounter}
              />
            )}
          </div>

          {/* Ticket Details Modal */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl relative">
                {/* Close button */}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>

                <div className="p-6">
                  <TicketDetails
                    ticket={selectedTicket}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={refreshTickets}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;