import React, { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Link, useNavigate } from "react-router-dom"; // Import React Router

interface TechnicianHeaderProps {
  currentUser?: { id: string; name: string; email: string; role: string; avatar_url?: string };
  title?: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  ticket_id?: string;
  message: string;
  read: boolean;
  created_at: string;
}

const TechnicianHeader: React.FC<TechnicianHeaderProps> = ({
  currentUser,
  title,
  subtitle,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate(); // For programmatic navigation

  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) console.error("Notifications Error:", error);
    else setNotifications(data ?? []);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login"); // SPA navigation after logout
  };

  return (
    <header className="w-full bg-blue-600 p-4 sm:p-6 shadow-md min-h-[80px]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        {/* Left Side - Title & Subtitle */}
        <div className="flex flex-col justify-center min-h-[50px] sm:min-h-[60px]">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
            {title || "\u00A0"}
          </h1>
          <p className="text-blue-100 text-sm sm:text-base">
            {subtitle || "\u00A0"}
          </p>
        </div>

        {/* Right Side - Notifications & Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4 mt-2 sm:mt-0 relative">
          {/* Notifications */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 rounded-full hover:bg-blue-500 transition"
              >
                <Bell className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold px-4 py-3 border-b bg-gray-50 text-gray-900">
                    Notifications
                  </h3>
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 text-sm">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                          !n.read ? "bg-blue-50 font-medium" : "bg-white"
                        }`}
                      >
                        <p className="text-gray-800 text-sm">{n.message}</p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile Dropdown */}
          {currentUser && (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base hover:opacity-90 transition"
              >
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials(currentUser.name)
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-hidden">
                  {/* React Router Link for SPA navigation */}
                  <Link
                    to="/profile-settings"
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TechnicianHeader;
