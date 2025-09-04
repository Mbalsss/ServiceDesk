import React, { useState } from "react";
import AssignedTickets from "./AssignedTickets";
import UnassignedTicketsQueue from "./UnassignedTicketsQueue";
import TicketDetails from "../user/TicketDetails";

interface CurrentUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

const TicketsPage: React.FC<{ currentUser: CurrentUser }> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<"assigned" | "unassigned">("assigned");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const handleViewTicket = (ticket: any) => {
    const mappedTicket = {
      ...ticket,
      numeric_id: ticket.id,
      createdAt: ticket.created_at ? new Date(ticket.created_at) : new Date(),
      updatedAt: ticket.updated_at ? new Date(ticket.updated_at) : new Date(),
      assignee: ticket.assignee_id || "Unassigned",
      requester: ticket.requester_name || "Unknown",
    };
    setSelectedTicket(mappedTicket);
  };

  const handleTicketTaken = () => {
    // Toggle refresh flag to trigger refetch in AssignedTickets
    setRefreshFlag(prev => !prev);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tickets Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("assigned")}
          className={`px-4 py-2 font-medium ${activeTab === "assigned" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Assigned Tickets
        </button>
        <button
          onClick={() => setActiveTab("unassigned")}
          className={`px-4 py-2 font-medium ${activeTab === "unassigned" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Unassigned Tickets
        </button>
      </div>

      {/* Tickets List */}
      {!selectedTicket && (
        <div className="mt-4">
          {activeTab === "assigned" && (
            <AssignedTickets
              key={refreshFlag.toString()}
              currentUser={currentUser}
              onViewTicket={handleViewTicket}
              refreshFlag={refreshFlag}
            />
          )}

          {activeTab === "unassigned" && (
            <UnassignedTicketsQueue
              key={refreshFlag.toString()}
              currentUser={currentUser}
              onTicketTaken={handleTicketTaken}
              onViewTicket={handleViewTicket}
            />
          )}
        </div>
      )}

      {/* Ticket Details */}
      {selectedTicket && (
        <div className="mt-6">
          <TicketDetails
            ticket={selectedTicket}
            currentUser={currentUser}
            onBack={() => setSelectedTicket(null)}
          />
        </div>
      )}
    </div>
  );
};

export default TicketsPage;
