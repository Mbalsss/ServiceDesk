import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  ticket_updates_email: boolean;
  announcements_email: boolean;
  ticket_updates_in_app: boolean;
  announcements_in_app: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotificationPreferences = (userId: string) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          await createDefaultPreferences(userId);
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (error: any) {
      console.error('Error fetching notification preferences:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          email_enabled: true,
          in_app_enabled: true,
          ticket_updates_email: true,
          announcements_email: false,
          ticket_updates_in_app: true,
          announcements_in_app: true,
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error: any) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return false;
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', preferences.id);

      if (error) throw error;

      // Update local state
      setPreferences(prev => prev ? { ...prev, ...updates, updated_at: new Date().toISOString() } : null);
      return true;
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      setError(error.message);
      return false;
    }
  };

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  return {
    preferences,
    loading,
    error,
    refetch: fetchPreferences,
    updatePreferences,
  };
};