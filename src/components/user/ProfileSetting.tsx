import React, { useState, useEffect, useCallback } from "react";
import {
  Save, Bell, Mail, Lock, User, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  Shield, Settings, Building, Database, RefreshCw
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// --- INTERFACES ---
interface ProfileSettingsProps {
  currentUser: { id: string; name: string; email: string; department?: string | null };
  onUpdate: (user: { name: string; email: string; department?: string | null }) => void;
}

// Frontend state structure
interface NotificationPreferencesState {
  email: boolean;
  ticket_updates: boolean;
  announcements: boolean;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdate }) => {
  // --- STATE ---
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || "");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize with default state
  const [notifications, setNotifications] = useState<NotificationPreferencesState>({
    email: true,
    ticket_updates: true,
    announcements: false,
  });

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [notificationSettingsAvailable, setNotificationSettingsAvailable] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // --- HELPER FUNCTIONS ---
  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Function to check if notification_settings table exists
  const checkNotificationTableExists = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('notification_settings')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01') { // Table doesn't exist
          console.error("Notification settings table doesn't exist:", error);
          setNotificationSettingsAvailable(false);
          showMessage("error", "Notification settings table is not configured. Please contact administrator.");
          return false;
        }
        throw error;
      }
      return true;
    } catch (error) {
      console.error("Error checking notification table:", error);
      setNotificationSettingsAvailable(false);
      showMessage("error", "Error accessing notification settings.");
      return false;
    }
  }, [showMessage]);

  // Function to create default settings if none exist
  const createDefaultNotificationSettings = useCallback(async () => {
    try {
      const tableExists = await checkNotificationTableExists();
      if (!tableExists) return false;

      const { error } = await supabase
        .from("notification_settings")
        .insert({
          user_id: currentUser.id, // This should match profiles(id)
          email_enabled: true,
          ticket_updates_email: true,
          announcements_email: false,
          in_app_enabled: true,
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          console.info("Default notification settings already exist for this user.");
          return true;
        }
        console.error("Error creating notification settings:", error);
        throw error;
      }

      setNotifications({
        email: true,
        ticket_updates: true,
        announcements: false,
      });
      console.log("Default notification settings created.");
      return true;
    } catch (error) {
      console.error("Error creating default notification settings:", error);
      showMessage("error", "Failed to initialize notification settings.");
      return false;
    }
  }, [currentUser.id, showMessage, checkNotificationTableExists]);

  // --- EFFECTS ---
  // Fetch notification settings on mount
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      setLoading(true);
      
      try {
        // First check if table exists
        const tableExists = await checkNotificationTableExists();
        if (!tableExists) {
          setLoading(false);
          return;
        }

        // Try to fetch user's notification settings
        const { data, error, status } = await supabase
          .from("notification_settings")
          .select("email_enabled, ticket_updates_email, announcements_email")
          .eq("user_id", currentUser.id)
          .single();

        if (error) {
          if (status === 406 || status === 404) { // PGRST116 or no rows found
            console.log("No notification settings found, creating defaults...");
            const created = await createDefaultNotificationSettings();
            setDbInitialized(created);
            
            // If creation failed, try to fetch again
            if (created) {
              const { data: newData } = await supabase
                .from("notification_settings")
                .select("email_enabled, ticket_updates_email, announcements_email")
                .eq("user_id", currentUser.id)
                .single();
              
              if (newData) {
                setNotifications({
                  email: newData.email_enabled,
                  ticket_updates: newData.ticket_updates_email,
                  announcements: newData.announcements_email,
                });
              }
            }
          } else {
            console.error("Error fetching notification settings:", error);
            setNotificationSettingsAvailable(false);
            showMessage("error", "Failed to load notification settings.");
          }
        } else if (data) {
          setNotifications({
            email: data.email_enabled,
            ticket_updates: data.ticket_updates_email,
            announcements: data.announcements_email,
          });
          setNotificationSettingsAvailable(true);
          setDbInitialized(true);
        }
      } catch (error) {
        console.error("Catch-all error in fetchNotificationSettings:", error);
        setNotificationSettingsAvailable(false);
        showMessage("error", "An unexpected error occurred with notification settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationSettings();
  }, [currentUser.id, createDefaultNotificationSettings, showMessage, checkNotificationTableExists]);

  // Function to manually retry loading notification settings
  const retryNotificationSettings = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const tableExists = await checkNotificationTableExists();
      if (!tableExists) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("notification_settings")
        .select("email_enabled, ticket_updates_email, announcements_email")
        .eq("user_id", currentUser.id)
        .single();

      if (error) {
        // Try to create default settings if they don't exist
        const created = await createDefaultNotificationSettings();
        setDbInitialized(created);
      } else if (data) {
        setNotifications({
          email: data.email_enabled,
          ticket_updates: data.ticket_updates_email,
          announcements: data.announcements_email,
        });
        setNotificationSettingsAvailable(true);
        setDbInitialized(true);
        showMessage("success", "Notification settings loaded successfully!");
      }
    } catch (error) {
      console.error("Error retrying notification settings:", error);
      showMessage("error", "Failed to load notification settings.");
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  // Profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, email, department })
        .eq("id", currentUser.id);

      if (error) throw error;

      onUpdate({ name, email, department });
      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("error", `Failed to update profile: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "Password updated successfully!");
    } catch (error) {
      console.error("Error updating password:", error);
      showMessage("error", `Failed to update password: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Notification preferences
  const handleNotificationsChange = async (type: keyof NotificationPreferencesState) => {
    if (!notificationSettingsAvailable) {
      showMessage("error", "Notification settings are not available. Please try again later.");
      return;
    }

    if (!dbInitialized) {
      showMessage("error", "Database not initialized. Please refresh the page.");
      return;
    }

    const updatedNotifications = {
      ...notifications,
      [type]: !notifications[type]
    };

    setNotifications(updatedNotifications);

    try {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: currentUser.id,
          email_enabled: updatedNotifications.email,
          ticket_updates_email: updatedNotifications.ticket_updates,
          announcements_email: updatedNotifications.announcements,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      showMessage("success", "Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notifications:", error);
      showMessage("error", `Failed to save preferences: ${error instanceof Error ? error.message : String(error)}`);
      setNotifications(notifications);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Sidebar */}
      <div className="lg:w-1/4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" /> Account Settings
          </h2>
          <nav className="space-y-1">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "security", label: "Security", icon: Lock },
              { id: "notifications", label: "Notifications", icon: Bell },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:w-3/4 space-y-6">
        {/* Profile Section */}
        {activeSection === "profile" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Update your personal information and how others see you on the platform.
              </p>
            </div>
            {/* Profile Form */}
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text" id="department" value={department} onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Engineering, Marketing, Support"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || (name === currentUser.name && email === currentUser.email && department === currentUser.department)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">Change your password to keep your account secure.</p>
            </div>
            {/* Password Form */}
            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"} id="currentPassword"
                    value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                    placeholder="Enter your current password"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"} id="newPassword"
                      value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                      placeholder="At least 6 characters" minLength={6}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"} id="confirmPassword"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-12"
                      placeholder="Confirm your new password" minLength={6}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === "notifications" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Manage how you receive notifications and updates.
              </p>
              {!notificationSettingsAvailable && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    Notification settings are currently unavailable. Please ensure the database table is configured correctly and try again.
                  </p>
                  <button
                    onClick={retryNotificationSettings}
                    disabled={loading}
                    className="mt-2 flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Retry
                  </button>
                </div>
              )}
              {!dbInitialized && notificationSettingsAvailable && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    Initializing notification settings...
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {[
                { key: "email" as const, title: "Email Notifications", description: "Receive important updates via email" },
                { key: "ticket_updates" as const, title: "Ticket Updates", description: "Get notified when your tickets are updated" },
                { key: "announcements" as const, title: "Announcements", description: "Receive system announcements and news" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications[item.key]}
                      onChange={() => handleNotificationsChange(item.key)}
                      className="sr-only peer"
                      disabled={!notificationSettingsAvailable || !dbInitialized || loading}
                    />
                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${notificationSettingsAvailable && dbInitialized ? 'peer-checked:bg-blue-600' : 'peer-checked:bg-gray-400'}`}></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md z-50 ${
          message.type === "success" ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {message.type === "success" ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-4 text-gray-400 hover:text-gray-600">×</button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;