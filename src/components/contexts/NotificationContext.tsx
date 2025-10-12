// src/components/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';

// Define types for notifications
interface Notification {
  id: string;
  recipient_id: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  ticket_id?: string;
}

// Define types for notification preferences
interface NotificationPreferences {
  email: boolean;
  ticket_updates: boolean;
  announcements: boolean;
}

interface NotificationContextType {
  // Notification items
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearNotification: (notificationId: string) => void;
  
  // Notification preferences
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (prefs: NotificationPreferences) => Promise<void>;
  loadingPreferences: boolean;
  fetchNotificationPreferences: () => Promise<void>;
}

// Create context with default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  fetchNotifications: async () => {},
  clearNotification: () => {},
  notificationPreferences: {
    email: true,
    ticket_updates: true,
    announcements: false,
  },
  updateNotificationPreferences: async () => {},
  loadingPreferences: false,
  fetchNotificationPreferences: async () => {},
});

interface NotificationProviderProps {
  children: ReactNode;
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Notification preferences state - using local state only
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email: true,
    ticket_updates: true,
    announcements: false,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  // Fetch current user with better error handling
  useEffect(() => {
    let mounted = true;

    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error) {
          console.log('Auth session not available yet:', error.message);
          setUserId(null);
          return;
        }
        
        if (user) {
          setUserId(user.id);
        } else {
          setUserId(null);
        }
      } catch (error) {
        if (!mounted) return;
        console.log('Error fetching user (non-critical):', error);
        setUserId(null);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setNotifications([]);
        setUnreadCount(0);
        setNotificationPreferences({
          email: true,
          ticket_updates: true,
          announcements: false,
        });
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // SIMPLIFIED: Fetch notification preferences - using local state only
  const fetchNotificationPreferences = useCallback(async () => {
    if (!userId) {
      // Return default preferences if no user
      setNotificationPreferences({
        email: true,
        ticket_updates: true,
        announcements: false,
      });
      return;
    }
    
    try {
      setLoadingPreferences(true);
      
      // Use localStorage as backup, but default to true/true/false
      const storedPrefs = localStorage.getItem(`notification_prefs_${userId}`);
      
      if (storedPrefs) {
        const prefs = JSON.parse(storedPrefs);
        setNotificationPreferences(prefs);
      } else {
        // Default preferences
        const defaultPrefs = {
          email: true,
          ticket_updates: true,
          announcements: false,
        };
        setNotificationPreferences(defaultPrefs);
      }
    } catch (error) {
      console.log("Error loading notification preferences (using defaults):", error);
      setNotificationPreferences({
        email: true,
        ticket_updates: true,
        announcements: false,
      });
    } finally {
      setLoadingPreferences(false);
    }
  }, [userId]);

  // SIMPLIFIED: Update notification preferences - localStorage only
  const updateNotificationPreferences = async (prefs: NotificationPreferences) => {
    try {
      setLoadingPreferences(true);
      
      if (userId) {
        localStorage.setItem(`notification_prefs_${userId}`, JSON.stringify(prefs));
      }
      
      setNotificationPreferences(prefs);
    } catch (error) {
      console.log("Error updating notification preferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // SIMPLIFIED: Fetch notifications with better error handling
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // If table doesn't exist or other error, return empty array
        console.log('Notifications not available yet:', error.message);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data ? data.filter(n => !n.is_read).length : 0);
    } catch (error) {
      console.log('Error fetching notifications (non-critical):', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  // Set up realtime subscriptions with better error handling
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Fetch initial data
    fetchNotifications();
    fetchNotificationPreferences();

    // Set up realtime subscription only if we have a user
    let channel: any;
    
    try {
      channel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications(prev => [payload.new as Notification, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            setNotifications(prev =>
              prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n)
            );
            if (payload.old.is_read === false && payload.new.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe((status) => {
          console.log('Notification subscription status:', status);
        });

    } catch (error) {
      console.log('Could not set up realtime notifications (non-critical)');
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, fetchNotifications, fetchNotificationPreferences]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      if (error) {
        // If database operation fails, just update local state
        console.log('Mark as read failed, updating local state only:', error.message);
      }

      // Always update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Error marking notification as read:', error);
      // Still update local state on error
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        console.log('Mark all as read failed, updating local state only:', error.message);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.log('Error marking all notifications as read:', error);
      // Still update local state on error
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  };

  // Clear a single notification
  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const contextValue: NotificationContextType = {
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications,
    clearNotification,
    notificationPreferences,
    updateNotificationPreferences,
    loadingPreferences,
    fetchNotificationPreferences,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};