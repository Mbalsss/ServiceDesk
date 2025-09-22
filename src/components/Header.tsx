import React, { useState, useEffect, useRef } from "react";
import { Bell, Search, Trash2, User, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  currentUser: string;
}

interface Ticket {
  id: number;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<Ticket[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const serviceDeskData = [
    "Ticket #101 - Printer Issue",
    "Ticket #102 - Network Down",
    "Workflow - New Hire Setup",
    "User - John Doe",
    "System Integration - Slack"
  ];

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
    } else {
      const results = serviceDeskData.filter(item =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearNotifications = () => setNotifications([]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left empty now */}
        <div className="cursor-pointer"></div>

        {/* Right Section */}
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets, workflows, users..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? searchResults.map((item, i) => (
                  <div key={i} className="p-2 hover:bg-gray-100 cursor-pointer">{item}</div>
                )) : <div className="p-2 text-gray-500">No results found</div>}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs flex items-center text-red-500 hover:underline"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear All
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                    {notifications.map((ticket) => (
                      <li key={ticket.id} className="p-2 bg-gray-50 rounded hover:bg-gray-100">
                        {ticket.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No new notifications</p>
                )}
              </div>
            )}
          </div>

          {/* User Profile with Dropdown */}
          <div className="relative flex items-center space-x-2 pl-4 border-l border-gray-200" ref={profileRef}>
            <div 
              className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
              onClick={() => setShowProfile(!showProfile)}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">
                  {currentUser.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 ml-2 hidden md:block">{currentUser}</span>
            </div>
            
            {/* Profile Dropdown */}
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {currentUser.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{currentUser}</p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  
                  <hr className="my-2" />
                  
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;