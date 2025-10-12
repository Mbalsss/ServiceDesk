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
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tickets Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage assigned and unassigned tickets</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Tabs - Improved mobile layout */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex min-w-max sm:min-w-0" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("assigned")}
                className={`py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === "assigned"
                    ? "border-[#5483B3] text-[#5483B3]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Assigned Tickets
              </button>
              <button
                onClick={() => setActiveTab("unassigned")}
                className={`py-3 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                  activeTab === "unassigned"
                    ? "border-[#5483B3] text-[#5483B3]"
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

          {/* Ticket Details Modal - Improved mobile modal */}
          {selectedTicket && (
            <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] sm:max-h-[95vh] overflow-y-auto relative">
                {/* Close button - Better mobile positioning */}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <span className="text-lg">✕</span>
                </button>

                <div className="p-4 sm:p-6">
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