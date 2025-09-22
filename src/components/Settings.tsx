import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, Ticket, User, Lock, Save, Bell, Palette, Edit, Mail, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserAccount {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  available: boolean;
  created_at: string;
  updated_at: string;
}

interface TicketField {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

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
  
  // Profile State (separated from password)
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    department: '',
    phone: '',
  });

  // Password State (separated from profile)
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // User Management
  const [users, setUsers] = useState<UserAccount[]>([]);

  // Preferences
  const [preferences, setPreferences] = useState<Preferences>({
    email_notifications: true,
    notifications: true,
    ticket_updates_email: true,
    announcements_email: false,
  });

  // Ticket Fields
  const [ticketFields, setTicketFields] = useState<TicketField[]>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUsers(),
        fetchPreferences(),
        fetchTicketFields(),
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
        phone: data.phone || '',
      });
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    if (data) {
      setUsers(data as UserAccount[]);
    }
  };

  const fetchPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // First get the profile ID for the current user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Now fetch notification settings using the profile ID
      const { data, error } = await supabase
        .from('notification_settings')
        .select('email_enabled, in_app_enabled, ticket_updates_email, announcements_email')
        .eq('user_id', profileData.id)
        .maybeSingle();

      if (error) {
        console.log('Error fetching notification settings:', error);
        
        // If no settings exist, create default ones
        if (error.code === 'PGRST116') { // No rows found
          await createDefaultNotificationSettings(profileData.id);
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

  const createDefaultNotificationSettings = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .insert({
          user_id: profileId,
          email_enabled: true,
          in_app_enabled: true,
          ticket_updates_email: true,
          announcements_email: false,
        });

      if (error) {
        console.error('Error creating default notification settings:', error);
      } else {
        console.log('Default notification settings created');
        
        // Set the default preferences in state
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

  const fetchTicketFields = async () => {
    try {
      // Mock data for ticket fields - in a real app, you'd fetch from a ticket_fields table
      const mockFields: TicketField[] = [
        { id: '1', name: 'Priority', type: 'Dropdown', created_at: new Date().toISOString() },
        { id: '2', name: 'Category', type: 'Dropdown', created_at: new Date().toISOString() },
        { id: '3', name: 'Due Date', type: 'Date', created_at: new Date().toISOString() },
        { id: '4', name: 'Urgency', type: 'Dropdown', created_at: new Date().toISOString() },
        { id: '5', name: 'Impact', type: 'Dropdown', created_at: new Date().toISOString() },
      ];
      setTicketFields(mockFields);
    } catch (error) {
      console.error('Error fetching ticket fields:', error);
      // Set default fields if there's an error
      setTicketFields([
        { id: '1', name: 'Priority', type: 'Dropdown', created_at: new Date().toISOString() },
        { id: '2', name: 'Category', type: 'Dropdown', created_at: new Date().toISOString() },
      ]);
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
          phone: profile.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profile updated successfully!');
    } catch (error: any) {
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Password functions
  const handlePasswordChange = (field: keyof typeof password, value: string) => {
    setPassword(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    if (password.newPassword !== password.confirmPassword) {
      setError('New passwords do not match!');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.newPassword
      });

      if (error) throw error;

      setSuccess('Password changed successfully!');
      setPassword({ 
        currentPassword: '', 
        newPassword: '', 
        confirmPassword: '' 
      });
    } catch (error: any) {
      setError('Failed to change password: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // User Management functions
  const updateUserRole = async (id: string, role: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, role } : u));
      setSuccess('User role updated successfully!');
    } catch (error: any) {
      setError('Failed to update user role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string, available: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          available, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, available } : u));
      setSuccess('User status updated successfully!');
    } catch (error: any) {
      setError('Failed to update user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserDepartment = async (id: string, department: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          department: department || null, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setUsers(users.map(u => u.id === id ? { ...u, department } : u));
      setSuccess('User department updated successfully!');
    } catch (error: any) {
      setError('Failed to update user department: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    setLoading(true);
    setError(null);
    
    try {
      // First check if the user has any assigned tickets
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .or(`assignee_id.eq.${id},requester_id.eq.${id},closed_by.eq.${id}`);

      if (ticketError) throw ticketError;
      
      if (tickets && tickets.length > 0) {
        setError('Cannot remove user with assigned tickets. Please reassign tickets first.');
        return;
      }

      // Check if user has any assigned equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('id')
        .eq('assigned_to', id);

      if (equipmentError) throw equipmentError;
      
      if (equipment && equipment.length > 0) {
        setError('Cannot remove user with assigned equipment. Please reassign equipment first.');
        return;
      }

      // Delete the user from auth (admin function)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
      if (deleteError) throw deleteError;

      setUsers(users.filter(u => u.id !== id));
      setSuccess('User removed successfully!');
    } catch (error: any) {
      setError('Failed to remove user: ' + error.message);
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

      // Get the profile ID for the current user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        throw new Error('Failed to fetch user profile');
      }

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: profileData.id,
          email_enabled: preferences.email_notifications,
          in_app_enabled: preferences.notifications,
          ticket_updates_email: preferences.ticket_updates_email,
          announcements_email: preferences.announcements_email,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setSuccess('Preferences saved successfully!');
    } catch (error: any) {
      setError('Failed to save preferences: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ticket Field functions
  const addTicketField = () => {
    if (!newFieldName.trim()) {
      setError('Please enter a field name');
      return;
    }

    const newField: TicketField = {
      id: Date.now().toString(),
      name: newFieldName,
      type: newFieldType,
      created_at: new Date().toISOString()
    };

    setTicketFields([...ticketFields, newField]);
    setNewFieldName('');
    setSuccess('Ticket field added successfully!');
  };

  const removeTicketField = (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;
    
    setTicketFields(ticketFields.filter(f => f.id !== id));
    setSuccess('Field deleted successfully!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Account', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'users', label: 'User Management', icon: User },
    { id: 'fields', label: 'Ticket Fields', icon: Ticket },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex items-center">
            <span>{success}</span>
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
                  className={`flex items-center space-x-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Profile & Account Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                  <p className="text-gray-600 mb-6">Update your personal information.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profile.full_name}
                        onChange={e => handleProfileChange('full_name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input
                        type="text"
                        value={profile.department}
                        onChange={e => handleProfileChange('department', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter department"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={e => handleProfileChange('phone', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Save Profile</span>
                  </button>
                </div>

                {/* Change Password Section */}
                <div className="border-t pt-8">
                  <h2 className="text-xl font-semibold mb-4">Change Password</h2>
                  <p className="text-gray-600 mb-6">Update your password to keep your account secure.</p>
                  
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={password.currentPassword}
                        onChange={e => handlePasswordChange('currentPassword', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        value={password.newPassword}
                        onChange={e => handlePasswordChange('newPassword', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={password.confirmPassword}
                        onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                      />
                    </div>
                    
                    <button
                      onClick={handlePasswordSave}
                      disabled={loading || !password.newPassword || !password.confirmPassword}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      <span>Change Password</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                  <p className="text-gray-600 mb-6">Customize how you receive notifications.</p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-2 text-blue-600" />
                      Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Notifications</label>
                          <p className="text-xs text-gray-500">Receive email alerts</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.email_notifications}
                            onChange={e => handlePreferenceChange('email_notifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Updates Email</label>
                          <p className="text-xs text-gray-500">Receive emails about ticket updates</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.ticket_updates_email}
                            onChange={e => handlePreferenceChange('ticket_updates_email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Announcements Email</label>
                          <p className="text-xs text-gray-500">Receive announcement emails</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.announcements_email}
                            onChange={e => handlePreferenceChange('announcements_email', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={savePreferences}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Preferences</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">User Management</h2>
                  <p className="text-gray-600 mb-4">Manage all system users and their access levels.</p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="px-4 py-3">
                              <div>
                                <div className="font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-600">{user.email}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select 
                                value={user.role} 
                                onChange={e => updateUserRole(user.id, e.target.value)} 
                                className="border rounded px-2 py-1 text-sm"
                                disabled={loading}
                              >
                                <option value="admin">Administrator</option>
                                <option value="technician">Technician</option>
                                <option value="user">User</option>
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                user.available 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.available ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                value={user.department || ''}
                                onChange={e => updateUserDepartment(user.id, e.target.value)}
                                className="border rounded px-2 py-1 text-sm w-32"
                                placeholder="Department"
                                disabled={loading}
                              />
                            </td>
                            <td className="px-4 py-3 flex space-x-2">
                              <button
                                onClick={() => toggleUserStatus(user.id, !user.available)}
                                disabled={loading}
                                className={`text-xs px-3 py-1 rounded ${
                                  user.available 
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                } disabled:opacity-50`}
                              >
                                {user.available ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => removeUser(user.id)}
                                disabled={loading}
                                className="text-red-600 hover:text-red-800 p-1 transition-colors disabled:opacity-50"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Ticket Fields Tab */}
            {activeTab === 'fields' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Ticket Fields</h2>
                  <p className="text-gray-600 mb-4">Manage custom fields for tickets.</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium mb-3">Add New Field</h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Field Name"
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newFieldType}
                        onChange={e => setNewFieldType(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Text">Text</option>
                        <option value="Dropdown">Dropdown</option>
                        <option value="Date">Date</option>
                        <option value="Number">Number</option>
                        <option value="Checkbox">Checkbox</option>
                        <option value="Textarea">Textarea</option>
                      </select>
                      <button
                        onClick={addTicketField}
                        disabled={!newFieldName.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Field</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Existing Fields</h3>
                    {ticketFields.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No custom fields created yet.</p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {ticketFields.map(field => (
                          <div key={field.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{field.name}</div>
                              <div className="text-sm text-gray-600">Type: {field.type}</div>
                              {field.created_at && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Created: {new Date(field.created_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeTicketField(field.id)}
                              className="text-red-600 hover:text-red-800 p-2 transition-colors"
                              title="Delete field"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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