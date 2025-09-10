import React, { useState } from "react";
import Sidebar from "./Sidebar"; // your Sidebar component

const Layout: React.FC = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const currentUser = { role: "admin" }; // change based on role (admin, technician, user)

  const logout = () => {
    console.log("Logging out...");
  };

  const onOpenCreateTicket = () => {
    console.log("Opening ticket creation form...");
  };

  const [chatOpen, setChatOpen] = useState(false);

  // Content filter by activeView
  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <div className="p-6">📊 Dashboard content here</div>;
      case "tickets":
      case "ticketsPage":
      case "my_tickets":
        return <div className="p-6">🎟 Tickets content here</div>;
      case "create":
        return <div className="p-6">➕ Create Ticket form here</div>;
      case "reports":
      case "performance":
        return <div className="p-6">📈 Reports/Analytics content here</div>;
      case "settings":
      case "profile_settings":
        return <div className="p-6">⚙ Settings content here</div>;
      default:
        return <div className="p-6">🔍 Select a menu item</div>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar fixed on the left */}
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        logout={logout}
        onOpenCreateTicket={onOpenCreateTicket}
        setChatOpen={setChatOpen}
      />

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">{renderContent()}</main>
    </div>
  );
};

export default Layout;
