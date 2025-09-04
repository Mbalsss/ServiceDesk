// src/components/user/UserHeader.tsx
import React from "react";
import { LogOut, User } from "lucide-react";

interface UserHeaderProps {
  currentUser: { name: string; email: string };
  onLogout: () => void;
  onNavigate?: (page: string) => void; // optional for navigation buttons
}

const UserHeader: React.FC<UserHeaderProps> = ({ currentUser, onLogout, onNavigate }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center p-4 bg-gray-50 border-b border-gray-200 rounded-lg mb-6">
      {/* App title / logo */}
      <div className="flex items-center gap-2 mb-2 md:mb-0">
        <h1 className="text-2xl font-bold text-gray-900">ServiceDesk</h1>
      </div>

      {/* Navigation links */}
      {onNavigate && (
        <nav className="flex items-center gap-4 mb-2 md:mb-0">
          <button
            onClick={() => onNavigate("dashboard")}
            className="px-3 py-1 text-gray-700 font-medium rounded hover:bg-gray-100"
          >
            Dashboard
          </button>
          <button
            onClick={() => onNavigate("profile")}
            className="px-3 py-1 text-gray-700 font-medium rounded hover:bg-gray-100"
          >
            Profile
          </button>
        </nav>
      )}

      {/* User info & logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-gray-700 font-medium">
          <User className="w-4 h-4" />
          <span>{currentUser.name}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-500"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default UserHeader;
