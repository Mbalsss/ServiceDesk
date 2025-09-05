// src/components/user/UserLayout.tsx
import React from "react";
import UserHeader from "./UserHeader";

interface UserLayoutProps {
  currentUser: { name: string; email: string };
  onLogout: () => void;
  children: React.ReactNode;
  onNavigate?: (page: string) => void; // optional navigation callback
}

const UserLayout: React.FC<UserLayoutProps> = ({ currentUser, onLogout, children, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Persistent header */}
      <UserHeader currentUser={currentUser} onLogout={onLogout} onNavigate={onNavigate} />

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default UserLayout;
