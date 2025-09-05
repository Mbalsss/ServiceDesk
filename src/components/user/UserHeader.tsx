import React, { useState, useRef, useEffect } from "react";
import { User, Bell } from "lucide-react";

interface UserHeaderProps {
  currentUser: { name: string; email: string };
}

const UserHeader: React.FC<UserHeaderProps> = ({ currentUser }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md relative">
      
      {/* Logo / App name */}
      <div className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          SD
        </div>
        <h1 className="text-2xl font-bold text-gray-900">ServiceDesk</h1>
      </div>

      {/* Right section: notifications + user info */}
      <div className="flex items-center gap-4 relative">

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* User info with dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={currentUser.email}
          >
            <User className="w-5 h-5 text-gray-600" />
            <span className="text-gray-800 font-medium">{currentUser.name}</span>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <div className="px-4 py-3 text-sm text-gray-700">
                <p className="font-medium">{currentUser.name}</p>
                <p className="truncate">{currentUser.email}</p>
              </div>
              <div className="border-t border-gray-200"></div>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                onClick={() => alert("Go to profile/settings")}
              >
                Profile & Settings
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default UserHeader;
