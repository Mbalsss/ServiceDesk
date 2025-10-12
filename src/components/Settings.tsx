import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Lock, Save, Bell, Loader, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Preferences {
  email_notifications: boolean;
  notifications: boolean;
  ticket_updates_email: boolean;
  announcements_email: boolean;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Profile State
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    department: '',
  });

  // Password State
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications: true,
    notifications: true,
    ticket_updates_email: true,
    announcements_email: false,
  });

  // Tabs array
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'preferences', label: 'Notifications', icon: Bell },
  ];

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchPreferences(),
      ]);
    } catch (error) {
      setError('Failed to load settings data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        email: data.email || '',
        department: data.department || '',
      });
    }
  };

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('email_enabled, in_app_enabled, ticket_updates_email, announcements_email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.log('Error fetching notification settings:', error);
        
        // Check if no records found (PGRST116 is the code for no rows returned)
        if (error.code === 'PGRST116') {
          await createDefaultNotificationSettings(user.id);
        }
        return;
      }

      if (data) {
        setPreferences(prev => ({
          ...prev,
          email_notifications: data.email_enabled,
          notifications: data.in_app_enabled,
          ticket_updates_email: data.ticket_updates_email,
          announcements_email: data.announcements_email,
        }));
      }
    } catch (error) {
      console.error('Unexpected error fetching preferences:', error);
    }
  };

  const createDefaultNotificationSettings = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          email_enabled: true,
          in_app_enabled: true,
          ticket_updates_email: true,
          announcements_email: false,
        });

      if (error) {
        console.error('Error creating default notification settings:', error);
      } else {
        setPreferences({
          email_notifications: true,
          notifications: true,
          ticket_updates_email: true,
          announcements_email: false,
        });
      }
    } catch (error) {
      console.error('Unexpected error creating default settings:', error);
    }
  };

  // Profile functions
  const handleProfileChange = (field: keyof typeof profile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          department: profile.department,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Failed to update profile: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Password functions - updated with current password verification
  const handlePasswordChange = (field: keyof typeof password, value: string) => {
    setPassword(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    // Validation
    if (!password.currentPassword) {
      setError('Please enter your current password');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      setError('New passwords do not match!');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (!password.newPassword) {
      setError('Please enter a new password');
      setTimeout(() => setError(null), 5000);
      return;
    }

    if (password.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // First, verify the current password by attempting to reauthenticate
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error('User not authenticated');

      // Reauthenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password.currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // If reauthentication successful, update the password
      const { error } = await supabase.auth.updateUser({
        password: password.newPassword
      });

      if (error) throw error;

      setSuccess('Password changed successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset form
      setPassword({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
      
      // Reset visibility states
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      
    } catch (error: any) {
      setError('Failed to change password: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Preferences functions
  const handlePreferenceChange = (field: keyof Preferences, value: any) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const savePreferences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notifications')
        .upsert({
          user_id: user.id,
          email_enabled: preferences.email_notifications,
          in_app_enabled: preferences.notifications,
          ticket_updates_email: preferences.ticket_updates_email,
          announcements_email: preferences.announcements_email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSuccess('Notification preferences saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Failed to save preferences: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-[#5483B3]" />
          <p className="text-gray-600 text-sm sm:text-base">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#5483B3]" />
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm sm:text-base">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm sm:text-base">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 sm:px-6 py-3 sm:py-4 font-medium text-sm border-b-2 transition-colors duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-[#5483B3] text-[#5483B3]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Profile Information</h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Update your personal information.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={e => handleProfileChange('full_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 bg-gray-50 cursor-not-allowed text-sm sm:text-base"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={profile.department}
                        onChange={e => handleProfileChange('department', e.target.value)}
                        className="w-full md:w-1/2 border border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                        placeholder="Enter your department"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="mt-4 sm:mt-6 bg-[#5483B3] text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#476a8a] transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Profile</span>
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Change Password</h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Update your password to keep your account secure.</p>
                  
                  <div className="max-w-md space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={password.currentPassword}
                          onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={password.newPassword}
                          onChange={e => handlePasswordChange('newPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                          placeholder="Enter new password (min. 6 characters)"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={password.confirmPassword}
                          onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                          placeholder="Confirm new password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePasswordSave}
                      disabled={loading || !password.currentPassword || !password.newPassword || !password.confirmPassword}
                      className="bg-[#5483B3] text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#476a8a] transition-colors duration-200 disabled:opacity-50 mt-3 sm:mt-4 text-sm sm:text-base w-full"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Notification Preferences</h2>
                  <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Customize how you receive notifications.</p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <h3 className="font-medium mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#5483B3]" />
                      Notification Settings
                    </h3>
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Notifications</label>
                          <p className="text-xs text-gray-500">Receive email alerts for important updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.email_notifications}
                            onChange={e => handlePreferenceChange('email_notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#5483B3]"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">In-App Notifications</label>
                          <p className="text-xs text-gray-500">Browser and in-app notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.notifications}
                            onChange={e => handlePreferenceChange('notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#5483B3]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Updates Email</label>
                          <p className="text-xs text-gray-500">Receive emails about ticket status changes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.ticket_updates_email}
                            onChange={e => handlePreferenceChange('ticket_updates_email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#5483B3]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Announcements Email</label>
                          <p className="text-xs text-gray-500">Receive system-wide announcement emails</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.announcements_email}
                            onChange={e => handlePreferenceChange('announcements_email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#5483B3]"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 flex justify-end">
                    <button
                      onClick={savePreferences}
                      disabled={loading}
                      className="bg-[#5483B3] text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-[#476a8a] transition-colors duration-200 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Notification Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;