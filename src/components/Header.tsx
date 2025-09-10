import React, { useState, useEffect, useRef } from "react";
import { Bell, Search, Settings, User, MessageSquare, Trash2 } from "lucide-react";

interface HeaderProps {
  currentUser: string;
}

interface Step {
  title: string;
  description: string;
}

const Header: React.FC<HeaderProps> = ({ currentUser }) => {
  const [notifications, setNotifications] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null);
  const [showAccountGuide, setShowAccountGuide] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Sample data to search
  const serviceDeskData = [
    "Ticket #101 - Printer Issue",
    "Ticket #102 - Network Down",
    "Workflow - New Hire Setup",
    "User - John Doe",
    "System Integration - Slack"
  ];

  // Simulate notifications every 1 minute
  useEffect(() => {
    const interval = setInterval(() => setNotifications(prev => prev + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // Search logic
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
        setActiveSettingsPage(null);
        setExpandedSteps({});
        setCheckedSteps({});
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
        setShowAccountGuide(false);
        setExpandedSteps({});
        setCheckedSteps({});
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearNotifications = () => setNotifications(0);
  const toggleStep = (index: number) => setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }));
  const toggleCheck = (index: number) => setCheckedSteps(prev => ({ ...prev, [index]: !prev[index] }));

  const handleHomeClick = () => {
    console.log("Navigating to Dashboard...");
    // If you have a main view state, call setCurrentView("dashboard");
  };

  const guides: Record<string, Step[]> = {
    preferences: [
      { title: "Customize Dashboard", description: "Go to Dashboard and click 'Customize' to edit layout." },
      { title: "Select Theme", description: "Choose Light or Dark theme." },
      { title: "Choose Language", description: "Select preferred language." },
      { title: "Notification Sounds", description: "Enable or disable notification sounds." },
      { title: "Save Changes", description: "Click 'Save Changes' to apply your settings." }
    ],
    system: [
      { title: "Workflows", description: "Go to Admin Panel → Workflows to create/edit rules." },
      { title: "Ticket Categories", description: "Define categories such as Hardware, Software, Network." },
      { title: "Integrations", description: "Connect Slack, Teams, or Email integration." },
      { title: "Test & Save", description: "Test the workflow and save changes." }
    ],
    help: [
      { title: "User Guides", description: "Step-by-step guides for creating tickets." },
      { title: "FAQs", description: "Check frequently asked questions." },
      { title: "Contact Support", description: "Email support@servicedesk.com or call +27 11 555 1234." }
    ],
    account: [
      { title: "Update Profile", description: "Update name, email, and phone number." },
      { title: "Change Password", description: "Secure your account by changing password regularly." },
      { title: "Manage Preferences", description: "Set dashboard theme, notifications, and language." },
      { title: "Manage Users", description: "Assign roles or modify other user access." },
      { title: "Save All Changes", description: "Save before exiting the account settings." }
    ]
  };

  const renderSteps = (steps: Step[]) => (
    <div className="mt-2 text-sm text-gray-700">
      {steps.map((step, index) => (
        <div key={index} className="border-b last:border-b-0 pb-1 mb-1">
          <div className="flex items-center">
            <input type="checkbox" checked={!!checkedSteps[index]} onChange={() => toggleCheck(index)} className="w-4 h-4" />
            <button className={`text-left font-medium ml-2 hover:text-blue-600 ${checkedSteps[index] ? 'line-through text-gray-400' : ''}`} onClick={() => toggleStep(index)}>
              {step.title}
            </button>
          </div>
          {expandedSteps[index] && <p className="text-gray-600 ml-6 mt-1">{step.description}</p>}
        </div>
      ))}
    </div>
  );

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center space-x-2 cursor-pointer" onClick={handleHomeClick}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">ServiceDesk Plus Cloud</h1>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
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

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-5 h-5" />
              {notifications > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notifications}</span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  {notifications > 0 && <button onClick={clearNotifications} className="text-xs flex items-center text-red-500 hover:underline"><Trash2 className="w-3 h-3 mr-1" /> Clear All</button>}
                </div>
                {notifications > 0 ? (
                  <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                    {Array.from({ length: notifications }).map((_, i) => <li key={i} className="p-2 bg-gray-50 rounded hover:bg-gray-100">New ticket update #{i + 1}</li>)}
                  </ul>
                ) : <p className="text-sm text-gray-500">No new notifications</p>}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => { setShowSettings(!showSettings); setActiveSettingsPage(null); setExpandedSteps({}); setCheckedSteps({}); }}>
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setActiveSettingsPage("preferences")}>Preferences</li>
                  <li className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setActiveSettingsPage("system")}>System Settings</li>
                  <li className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => setActiveSettingsPage("help")}>Help</li>
                </ul>
                {activeSettingsPage && renderSteps(guides[activeSettingsPage])}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative flex items-center space-x-2 pl-4 border-l border-gray-200" ref={profileRef}>
            <div className="flex items-center cursor-pointer" onClick={() => { setShowProfile(!showProfile); setShowAccountGuide(false); setExpandedSteps({}); setCheckedSteps({}); }}>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-600" /></div>
              <span className="text-sm font-medium text-gray-700">{currentUser}</span>
            </div>
            {showProfile && (
              <div className="absolute right-0 mt-12 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                <h3 className="font-semibold text-gray-700 mb-2">Profile</h3>
                <p className="text-sm text-gray-600 mb-2">Logged in as: <span className="font-bold">{currentUser}</span></p>
                <p className="text-sm text-green-600 font-semibold">Role: Admin</p>
                <hr className="my-2" />
                <ul className="space-y-1 text-sm text-gray-700">
                  <li className="p-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => { setShowAccountGuide(!showAccountGuide); setExpandedSteps({}); setCheckedSteps({}); }}>Account Settings</li>
                  {showAccountGuide && renderSteps(guides["account"])}
                  <li className="p-2 hover:bg-gray-100 rounded cursor-pointer text-red-600">Logout</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
