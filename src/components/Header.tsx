import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Bell, Trash2, Play, Coffee, PowerOff, Ticket, MessageCircle, RefreshCw, ChevronDown,
  Menu, X
} from "lucide-react";
import { supabase } from "../lib/supabase";

// --- Type Definitions ---
interface HeaderProps {
  currentUser: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

interface Notification {
  id: string;
  recipient_id: string;
  ticket_id: string | null;
  message: string;
  is_read: boolean;
  type: string;
  related_id?: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  status: 'Online' | 'On Break' | 'Offline';
  isactive: boolean;
}

// --- Helper Functions ---
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'ticket_assigned':
    case 'ticket_updated':
    case 'new_ticket':
      return <Ticket className="w-4 h-4 text-blue-500" />;
    case 'announcement':
      return <MessageCircle className="w-4 h-4 text-green-500" />;
    case 'message':
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-purple-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const formatNotificationType = (type: string) => {
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatTime = (timestamp: string) => {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return time.toLocaleDateString();
  } catch (error) {
    return 'Recently';
  }
};

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Online': return { color: 'bg-green-500', text: 'Online', icon: Play };
    case 'On Break': return { color: 'bg-yellow-500', text: 'On Break', icon: Coffee };
    default: return { color: 'bg-gray-500', text: 'Offline', icon: PowerOff };
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// --- Sub-Components ---

interface NotificationDropdownProps {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onRefresh: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications, loading, unreadCount, onRefresh, onMarkAsRead, onMarkAllAsRead, onClearAll, onClose
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div 
      ref={dropdownRef} 
      className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fade-in-down max-h-[80vh] flex flex-col"
    >
      <div className="p-3 sm:p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Notifications</h3>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRefresh}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors duration-150"
            title="Refresh notifications"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllAsRead}
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors duration-150"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-4 sm:p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-900 mb-1 leading-tight break-words">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 capitalize">
                        {formatNotificationType(notification.type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 sm:p-6 text-center">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up</p>
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-2 sm:p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button 
            onClick={onClearAll}
            className="w-full flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 py-2 rounded-md hover:bg-gray-200 transition-colors duration-150"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Clear all notifications</span>
          </button>
        </div>
      )}
    </div>
  );
};

interface StatusMenuProps {
  currentStatus: { status: 'Online' | 'On Break' | 'Offline'; timestamp: string; };
  onUpdateStatus: (newStatus: 'Online' | 'On Break' | 'Offline') => void;
  onClose: () => void;
}

const StatusMenu: React.FC<StatusMenuProps> = ({ currentStatus, onUpdateStatus, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in-down">
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 text-sm sm:text-base">Update Status</h3>
      </div>
      <div className="p-2 space-y-1">
        {[
          { status: 'Online', icon: Play, text: 'Go Online', color: 'green' },
          { status: 'On Break', icon: Coffee, text: 'Take Break', color: 'yellow' },
          { status: 'Offline', icon: PowerOff, text: 'Go Offline', color: 'gray' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentStatus.status === item.status;
          return (
            <button 
              key={item.status}
              onClick={() => onUpdateStatus(item.status as 'Online' | 'On Break' | 'Offline')} 
              className={`w-full flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 sm:py-3 text-left rounded-md transition-colors duration-150 ${
                isActive 
                  ? `bg-${item.color}-100 text-${item.color}-800` 
                  : `hover:bg-${item.color}-50`
              }`}
            >
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-${item.color}-500`}></div>
              <Icon className={`w-3 h-3 sm:w-4 sm:h-4 text-${item.color}-600`} />
              <div>
                <div className={`font-medium text-${item.color}-700 text-xs sm:text-sm`}>{item.text}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// --- Main Header Component ---
const Header: React.FC<HeaderProps> = ({ currentUser, onMenuToggle, isMenuOpen = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [currentStatus, setCurrentStatus] = useState({
    status: 'Offline' as 'Online' | 'On Break' | 'Offline',
    timestamp: new Date().toISOString()
  });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, status, isactive')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        setUserProfile(data as UserProfile);
        setCurrentStatus({
          status: data.status as 'Online' | 'On Break' | 'Offline',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Function to filter notifications based on user preferences
  const filterNotificationsByPreferences = useCallback(async (notifications: Notification[]): Promise<Notification[]> => {
    if (!userProfile?.id) return notifications;
    
    try {
      // Get user's notification preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userProfile.id)
        .single();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        return notifications; // Return all notifications if preferences can't be loaded
      }

      if (!preferences) {
        return notifications; // Return all notifications if no preferences found
      }

      // Filter notifications based on preferences
      return notifications.filter(notification => {
        // If in-app notifications are disabled globally, filter out all notifications
        if (!preferences.in_app_enabled) {
          return false;
        }

        // Filter based on specific notification types
        switch (notification.type) {
          case 'ticket_created':
          case 'ticket_assigned':
          case 'status_update':
          case 'priority_update':
          case 'assignment_update':
          case 'ticket_updated':
          case 'new_ticket':
          case 'new_comment':
            return preferences.ticket_updates_in_app;
          case 'announcement':
            return preferences.announcements_in_app;
          default:
            return true; // Allow unknown types
        }
      });
    } catch (error) {
      console.error('Error filtering notifications:', error);
      return notifications; // Return all notifications on error
    }
  }, [userProfile?.id]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userProfile?.id) return;
    
    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } else {
        // Filter notifications based on user preferences
        const filteredNotifications = await filterNotificationsByPreferences(data || []);
        setNotifications(filteredNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [userProfile?.id, filterNotificationsByPreferences]);

  // Real-time subscription for notifications
  const setupRealtimeSubscription = useCallback(() => {
    if (!userProfile?.id) return;
    
    const channel = supabase
      .channel(`notifications-${userProfile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userProfile.id}`
        },
        async (payload) => {
          // Filter the new notification before adding it
          const filteredNotifications = await filterNotificationsByPreferences([payload.new as Notification]);
          if (filteredNotifications.length > 0) {
            setNotifications(prev => [filteredNotifications[0], ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userProfile.id}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(notif => 
              notif.id === payload.new.id ? { ...notif, ...payload.new } : notif
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id, filterNotificationsByPreferences]);

  // Set up real-time subscription and initial fetch
  useEffect(() => {
    if (userProfile?.id) {
      // Always fetch notifications initially
      fetchNotifications();
      
      // Set up real-time subscriptions (always active)
      const unsubscribeRealtime = setupRealtimeSubscription();
      
      return () => {
        if (unsubscribeRealtime) unsubscribeRealtime();
      };
    }
  }, [userProfile?.id, fetchNotifications, setupRealtimeSubscription]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) console.error('Error marking as read:', error);
      else setNotifications(prev => prev.map(notif => notif.id === notificationId ? { ...notif, is_read: true } : notif));
    } catch (error) { console.error('Error:', error); }
  };

  const markAllAsRead = async () => {
    if (!userProfile?.id) return;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userProfile.id).eq('is_read', false);
      if (error) console.error('Error marking all as read:', error);
      else setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) { console.error('Error:', error); }
  };

  const clearAllNotifications = async () => {
    if (!userProfile?.id) return;
    try {
      const { error } = await supabase.from('notifications').delete().eq('recipient_id', userProfile.id);
      if (error) console.error('Error clearing notifications:', error);
      else setNotifications([]);
    } catch (error) { console.error('Error:', error); }
  };

  const updateTechnicianStatus = async (newStatus: 'Online' | 'On Break' | 'Offline') => {
    if (!userProfile) return;
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', userProfile.id);
      if (error) throw error;
      setCurrentStatus({ status: newStatus, timestamp: new Date().toISOString() });
      setUserProfile(prev => prev ? { ...prev, status: newStatus } : null);
      setShowStatusMenu(false);
    } catch (error) { console.error('Error updating status:', error); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const isTechnician = userProfile?.role === 'technician';
  const statusConfig = getStatusConfig(currentStatus.status);
  const greeting = getGreeting();
  const userName = userProfile?.full_name || 'User';

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-sm h-16 flex items-center justify-between">
        {/* Welcome Message Skeleton */}
        <div className="hidden lg:block">
          <div className="animate-pulse bg-gray-200 h-6 w-48 rounded"></div>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-4 sm:space-x-6">
          {isTechnician && <div className="animate-pulse bg-gray-200 h-8 w-20 sm:h-10 sm:w-28 rounded-lg"></div>}
          <div className="animate-pulse bg-gray-200 h-8 w-8 sm:h-10 sm:w-10 rounded-full"></div>
          <div className="animate-pulse bg-gray-200 h-6 w-24 sm:h-8 sm:w-32 rounded"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-sm h-16 flex items-center justify-between">
      {/* Welcome Message - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-900">
            {greeting}, {userName}!
          </h1>
          <p className="text-sm text-gray-600">
            Welcome to your Hapo Desk dashboard
          </p>
        </div>
      </div>

      {/* Mobile Welcome - Compact version */}
      <div className="lg:hidden">
        <div className="flex flex-col">
          <h1 className="text-base font-semibold text-gray-900">
            {greeting},
          </h1>
          <p className="text-xs text-gray-600 truncate max-w-[120px]">
            {userName}
          </p>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={onMenuToggle}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* User Controls Section - Better Spacing */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Technician Status */}
        {isTechnician && (
          <div className="relative">
            <button
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors duration-200 text-sm ${
                currentStatus.status === 'Online' 
                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                  : currentStatus.status === 'On Break'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              <div className={`w-2 h-2 rounded-full ${statusConfig.color}`}></div>
              <span className="font-medium">{statusConfig.text}</span>
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>

            {showStatusMenu && (
              <StatusMenu 
                currentStatus={currentStatus}
                onUpdateStatus={updateTechnicianStatus}
                onClose={() => setShowStatusMenu(false)}
              />
            )}
          </div>
        )}

        {/* Notifications with better spacing */}
        <div className="relative">
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            onClick={() => {
              // Always refresh when opening notifications panel
              fetchNotifications();
              setShowNotifications(!showNotifications);
            }}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              loading={notificationsLoading}
              unreadCount={unreadCount}
              onRefresh={fetchNotifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onClearAll={clearAllNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* User Info with better spacing and visual separation */}
        <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
          {/* User Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#5483B3] to-[#3A5C80] rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          
          {/* User Details - Hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-gray-900">
              {userName}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {userProfile?.role || 'User'}
            </span>
          </div>

          {/* Mobile user info - compact */}
          <div className="sm:hidden flex flex-col items-start">
            <span className="text-xs font-medium text-gray-900">
              {userName.split(' ')[0]}
            </span>
            <span className="text-xs text-gray-500 capitalize">
              {userProfile?.role || 'User'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;