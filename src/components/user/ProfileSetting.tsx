import React, { useState, useEffect } from "react";
import {
  Save, Bell, Mail, Lock, User, Loader2, CheckCircle, AlertCircle, Eye, EyeOff,
  Shield, Settings, Building
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ProfileSettingsProps {
  currentUser: { id: string; name: string; email: string; department?: string | null };
  onUpdate: (user: { name: string; email: string; department?: string | null }) => void;
}

// Updated interface to match your table schema
interface NotificationPreferences {
  email_enabled: boolean;
  in_app_enabled: boolean;
  ticket_updates_email: boolean;
  announcements_email: boolean;
  ticket_updates_in_app: boolean;
  announcements_in_app: boolean;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdate }) => {
  // Profile state
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || "");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Notification preferences (stored in Supabase)
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_enabled: true,
    in_app_enabled: true,
    ticket_updates_email: true,
    announcements_email: true,
    ticket_updates_in_app: true,
    announcements_in_app: true,
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Load notification preferences from Supabase
  const loadNotificationPreferences = async () => {
    setNotificationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 is "not found"
        throw error;
      }

      if (data) {
        setNotifications({
          email_enabled: data.email_enabled ?? true,
          in_app_enabled: data.in_app_enabled ?? true,
          ticket_updates_email: data.ticket_updates_email ?? true,
          announcements_email: data.announcements_email ?? true,
          ticket_updates_in_app: data.ticket_updates_in_app ?? true,
          announcements_in_app: data.announcements_in_app ?? true,
        });
      } else {
        // Create default preferences if none exist
        await createDefaultNotificationPreferences();
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      showMessage("error", "Failed to load notification preferences");
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Create default notification preferences
  const createDefaultNotificationPreferences = async () => {
    try {
      // First check if preferences already exist
      const { data: existingData } = await supabase
        .from("notification_preferences")
        .select("id")
        .eq("user_id", currentUser.id)
        .single();

      if (existingData) {
        // If exists, load the existing data instead of creating new
        await loadNotificationPreferences();
        return;
      }

      const defaultPreferences = {
        user_id: currentUser.id,
        email_enabled: true,
        in_app_enabled: true,
        ticket_updates_email: true,
        announcements_email: true,
        ticket_updates_in_app: true,
        announcements_in_app: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("notification_preferences")
        .insert([defaultPreferences]);

      if (error) {
        // If insert fails due to conflict, load existing data
        if (error.code === '23505') {
          await loadNotificationPreferences();
          return;
        }
        throw error;
      }

      setNotifications(defaultPreferences);
    } catch (error) {
      console.error("Error creating default notification preferences:", error);
      throw error;
    }
  };

  // Save notification preferences to Supabase
  const saveNotificationPreferences = async (newPreferences: NotificationPreferences) => {
    setNotificationsLoading(true);
    try {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({
          user_id: currentUser.id,
          email_enabled: newPreferences.email_enabled,
          in_app_enabled: newPreferences.in_app_enabled,
          ticket_updates_email: newPreferences.ticket_updates_email,
          announcements_email: newPreferences.announcements_email,
          ticket_updates_in_app: newPreferences.ticket_updates_in_app,
          announcements_in_app: newPreferences.announcements_in_app,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setNotifications(newPreferences);
      showMessage("success", "Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      showMessage("error", "Failed to save notification preferences");
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = async (type: keyof NotificationPreferences) => {
    const updated = {
      ...notifications,
      [type]: !notifications[type]
    };
    await saveNotificationPreferences(updated);
  };

  // Handle master toggle for email or in-app notifications
  const handleMasterToggle = async (masterType: 'email' | 'in_app') => {
    const enabledField = masterType === 'email' ? 'email_enabled' : 'in_app_enabled';
    const isCurrentlyEnabled = notifications[enabledField];
    
    const updated = {
      ...notifications,
      [enabledField]: !isCurrentlyEnabled,
      // Disable all sub-options when master is disabled
      ...(masterType === 'email' && !isCurrentlyEnabled ? {} : {
        ticket_updates_email: !isCurrentlyEnabled ? false : notifications.ticket_updates_email,
        announcements_email: !isCurrentlyEnabled ? false : notifications.announcements_email,
      }),
      ...(masterType === 'in_app' && !isCurrentlyEnabled ? {} : {
        ticket_updates_in_app: !isCurrentlyEnabled ? false : notifications.ticket_updates_in_app,
        announcements_in_app: !isCurrentlyEnabled ? false : notifications.announcements_in_app,
      }),
    };
    
    await saveNotificationPreferences(updated);
  };

  // Load notification preferences when component mounts or user changes
  useEffect(() => {
    if (currentUser.id) {
      loadNotificationPreferences();
    }
  }, [currentUser.id]);

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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-6xl mx-auto">
      {/* Sidebar */}
      <div className="lg:w-1/4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#5483B3]" /> Account Settings
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeSection === item.id
                    ? "bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] text-white shadow-lg"
                    : "text-gray-700 hover:bg-[#F0F5FC] hover:text-[#5483B3]"
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
            <div className="px-6 py-5 border-b border-gray-200 bg-[#F0F5FC]">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-[#5483B3]" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Update your personal information and how others see you on the platform.
              </p>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors"
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
                      className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors"
                      placeholder="e.g., Engineering, Marketing, Support"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading || (name === currentUser.name && email === currentUser.email && department === currentUser.department)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] text-white rounded-lg hover:from-[#3A5C80] hover:to-[#5483B3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
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
            <div className="px-6 py-5 border-b border-gray-200 bg-[#F0F5FC]">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#5483B3]" />
                <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">Change your password to keep your account secure.</p>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"} id="currentPassword"
                    value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors pr-12"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors pr-12"
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
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors pr-12"
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
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5483B3] to-[#7BA4D0] text-white rounded-lg hover:from-[#3A5C80] hover:to-[#5483B3] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications Section - Updated for new schema */}
        {activeSection === "notifications" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-[#F0F5FC]">
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-[#5483B3]" />
                <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Manage how you receive notifications and updates. Preferences are saved to your account.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {notificationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-[#5483B3]" />
                </div>
              ) : (
                <>
                  {/* Master Email Toggle */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-[#5483B3]" />
                        <div>
                          <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-600">Enable or disable all email notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.email_enabled}
                          onChange={() => handleMasterToggle('email')}
                          disabled={notificationsLoading}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>
                    
                    {notifications.email_enabled && (
                      <div className="space-y-3 pl-8 mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Ticket Updates</p>
                            <p className="text-sm text-gray-500">Get notified when your tickets are updated</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications.ticket_updates_email}
                              onChange={() => handleNotificationToggle('ticket_updates_email')}
                              disabled={notificationsLoading}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Announcements</p>
                            <p className="text-sm text-gray-500">Receive system announcements and news</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications.announcements_email}
                              onChange={() => handleNotificationToggle('announcements_email')}
                              disabled={notificationsLoading}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Master In-App Toggle */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[#5483B3]" />
                        <div>
                          <h3 className="font-semibold text-gray-900">In-App Notifications</h3>
                          <p className="text-sm text-gray-600">Enable or disable all in-app notifications</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.in_app_enabled}
                          onChange={() => handleMasterToggle('in_app')}
                          disabled={notificationsLoading}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                      </label>
                    </div>
                    
                    {notifications.in_app_enabled && (
                      <div className="space-y-3 pl-8 mt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Ticket Updates</p>
                            <p className="text-sm text-gray-500">Get notified when your tickets are updated</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications.ticket_updates_in_app}
                              onChange={() => handleNotificationToggle('ticket_updates_in_app')}
                              disabled={notificationsLoading}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">Announcements</p>
                            <p className="text-sm text-gray-500">Receive system announcements and news</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications.announcements_in_app}
                              onChange={() => handleNotificationToggle('announcements_in_app')}
                              disabled={notificationsLoading}
                              className="sr-only peer"
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5483B3] ${notificationsLoading ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> These preferences are saved to your account and will sync across all your devices.
                    </p>
                  </div>
                </>
              )}
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