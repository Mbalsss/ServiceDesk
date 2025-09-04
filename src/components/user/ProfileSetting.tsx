// src/components/user/ProfileSettings.tsx
import React, { useState } from "react";
import { Save, Bell, Mail, Lock, User, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ProfileSettingsProps {
  currentUser: { id: string; name: string; email: string; department?: string | null };
  onUpdate: (user: { name: string; email: string; department?: string | null }) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ currentUser, onUpdate }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [department, setDepartment] = useState(currentUser.department || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    ticketUpdates: true,
    announcements: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---------------------------
  // Profile update
  // ---------------------------
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
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Password change
  // ---------------------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password updated successfully!" });
    } catch (error) {
      console.error("Error updating password:", error);
      setMessage({ type: "error", text: "Failed to update password. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // Notification preferences
  // ---------------------------
  const handleNotificationsChange = async () => {
    try {
      console.log("Notification preferences:", notifications);
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessage({ type: "success", text: "Notification preferences saved!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences." });
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                minLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Change Password
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Section (unchanged) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>

        <div className="space-y-4">
          {["email", "ticketUpdates", "announcements"].map((type) => (
            <div key={type} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {type === "email" ? "Email Notifications" :
                   type === "ticketUpdates" ? "Ticket Updates" : "Announcements"}
                </p>
                <p className="text-sm text-gray-500">
                  {type === "email" ? "Receive important updates via email" :
                   type === "ticketUpdates" ? "Get notified when your tickets are updated" : "Receive system announcements and news"}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications[type as keyof typeof notifications]}
                  onChange={(e) => {
                    setNotifications({ ...notifications, [type]: e.target.checked });
                    handleNotificationsChange();
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-md ${
          message.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          <div className="flex items-center gap-2">
            {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p>{message.text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
