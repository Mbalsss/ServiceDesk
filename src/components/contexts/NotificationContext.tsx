// src/components/contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../../lib/supabase'; // Adjust path as needed

// Define types for notifications
interface Notification {
  id: number;
  recipient_id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_ticket_id?: number;
  related_entity_type?: string;
  related_entity_id?: number;
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
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  clearNotification: (notificationId: number) => void;
  
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
  
  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    email: true,
    ticket_updates: true,
    announcements: false,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          setUserId(user.id);
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUserId(null);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      subscription.unsubscribe();
    };
  }, []);

  // Fetch notification preferences
  const fetchNotificationPreferences = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingPreferences(true);
      const { data, error } = await supabase
        .from("notification_settings")
        .select("email_enabled, ticket_updates_email, announcements_email")
        .eq("user_id", userId)
        .single();

      if (data) {
        setNotificationPreferences({
          email: data.email_enabled,
          ticket_updates: data.ticket_updates_email,
          announcements: data.announcements_email,
        });
      } else if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error("Error fetching notification preferences:", error);
        
        // Create default settings if they don't exist
        if (error.code === 'PGRST116') {
          await createDefaultNotificationSettings();
        }
      }
    } catch (error) {
      console.error("Error in fetchNotificationPreferences:", error);
    } finally {
      setLoadingPreferences(false);
    }
  }, [userId]);

  // Create default notification settings
  const createDefaultNotificationSettings = async () => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from("notification_settings")
        .insert({
          user_id: userId,
          email_enabled: true,
          ticket_updates_email: true,
          announcements_email: false,
          in_app_enabled: true,
        }, { 
          onConflict: 'user_id' 
        });

      if (error && error.code !== '23505') { // Ignore unique constraint errors
        throw error;
      }

      setNotificationPreferences({
        email: true,
        ticket_updates: true,
        announcements: false,
      });
    } catch (error) {
      console.error("Error creating default notification settings:", error);
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = async (prefs: NotificationPreferences) => {
    if (!userId) return;
    
    try {
      setLoadingPreferences(true);
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: userId,
          email_enabled: prefs.email,
          ticket_updates_email: prefs.ticket_updates,
          announcements_email: prefs.announcements,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      setNotificationPreferences(prefs);
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data ? data.filter(n => !n.is_read).length : 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  // Set up realtime subscriptions and initial data fetching
  useEffect(() => {
    if (userId) {
      // Fetch initial data
      fetchNotifications();
      fetchNotificationPreferences();

      // Realtime subscription for notifications
      const channel = supabase
        .channel(`notifications:${userId}`)
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
              prev.map(n => n.id === payload.old.id ? payload.new as Notification : n)
            );
            if (payload.old.is_read === false && payload.new.is_read === true) {
              setUnreadCount(prev => Math.max(0, prev - 1));
            }
          }
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    }
  }, [userId, fetchNotifications, fetchNotificationPreferences]);

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('recipient_id', userId);

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
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

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear a single notification
  const clearNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <NotificationContext.Provider 
      value={{ 
        // Notification items
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead, 
        fetchNotifications,
        clearNotification,
        
        // Notification preferences
        notificationPreferences,
        updateNotificationPreferences,
        loadingPreferences,
        fetchNotificationPreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};