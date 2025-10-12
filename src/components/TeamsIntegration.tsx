// components/TeamsIntegration.tsx
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Bot,
  Zap,
  CheckCircle,
  Settings,
  Users,
  Bell,
  Activity,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Info,
} from "lucide-react";
import { teamsService, TeamsIntegrationConfig } from '../services/teamsService';
import { supabase } from '../lib/supabase';

const TeamsIntegration: React.FC = () => {
  const [config, setConfig] = useState<TeamsIntegrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Color scheme matching the reports and copilot components
  const colors = {
    primary: '#5483B3',      // Brand Blue
    primaryLight: '#7BA4D0', // Light Blue
    secondary: '#5AB8A8',    // Teal
    accent: '#D0857B',       // Red
    dark: '#3A5C80',         // Dark Blue
    gray: '#607d8b',         // Gray
    background: '#F0F5FC',   // Light Blue Background
    success: '#5AB8A8',      // Teal for success
    warning: '#D0857B',      // Red for warnings
  };

  // Load configuration on component mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setError('Please sign in to configure Teams integration');
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      const teamsConfig = await teamsService.getConfig(user.id);
      setConfig(teamsConfig);
    } catch (error) {
      console.error('Failed to load Teams configuration:', error);
      setError('Failed to load Teams configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (newConfig: TeamsIntegrationConfig) => {
    if (!currentUser) return;
    
    setSaving(true);
    setError(null);
    try {
      const success = await teamsService.saveConfig(currentUser.id, newConfig);
      if (!success) throw new Error('Failed to save configuration');
      setConfig(newConfig);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save Teams configuration:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUser) {
      setError('Please sign in to configure Teams integration');
      return;
    }
    
    console.log('🔄 Starting Teams connection for user:', currentUser.id);
    
    setSaving(true);
    setError(null);
    try {
      const success = await teamsService.connectToTeams(currentUser.id);
      if (!success) {
        throw new Error('Failed to initiate Teams connection');
      }
      
      console.log('✅ Teams connection initiated - user will be redirected to Microsoft');
      // DO NOT call loadConfig() here - we're being redirected to Microsoft
      // The saving state will remain true until the user returns from Microsoft
      
    } catch (error) {
      console.error('❌ Failed to connect to Teams:', error);
      setError('Failed to connect to Teams. Please try again.');
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to disconnect from Teams? This will remove all integration settings.')) {
      return;
    }
    
    setSaving(true);
    setError(null);
    try {
      const success = await teamsService.disconnectFromTeams(currentUser.id);
      if (!success) throw new Error('Failed to disconnect from Teams');
      
      // Reload config to get updated state
      await loadConfig();
      setSuccess('Successfully disconnected from Teams!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to disconnect from Teams:', error);
      setError('Failed to disconnect from Teams');
      setSaving(false);
    }
  };

  const handleOpenInTeams = async () => {
    try {
      await teamsService.openInTeams();
    } catch (error) {
      console.error('Failed to open Teams:', error);
      setError('Failed to open Teams. Please make sure Teams is installed and the app is properly configured.');
    }
  };

  // Check for success/error parameters when component loads
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successParam = urlParams.get('success');
    const errorParam = urlParams.get('error');
    const message = urlParams.get('message');

    if (successParam === 'true') {
      setError(null);
      setSuccess('Teams integration has been successfully connected!');
      // Reload config to get updated connection status
      loadConfig();
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } else if (errorParam) {
      setError(`Teams connection failed: ${message || errorParam}`);
      
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleNotificationChange = (key: keyof TeamsIntegrationConfig['notificationSettings']) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      notificationSettings: {
        ...config.notificationSettings,
        [key]: !config.notificationSettings[key],
      },
    };
    saveConfig(newConfig);
  };

  const handleCopilotChange = (key: keyof TeamsIntegrationConfig['copilotSettings']) => {
    if (!config) return;
    
    const newConfig = {
      ...config,
      copilotSettings: {
        ...config.copilotSettings,
        [key]: !config.copilotSettings[key],
      },
    };
    saveConfig(newConfig);
  };

  // Feature status based on actual configuration
  const integrationFeatures = [
    {
      icon: MessageSquare,
      title: "Chat Support",
      description: "Enable end users to create and track tickets directly through Teams chat",
      status: config?.connected ? "active" : "inactive",
      dependsOn: 'connected' as const,
    },
    {
      icon: Bot,
      title: "Microsoft 365 Copilot",
      description: "AI-powered assistance for ticket resolution and knowledge base queries",
      status: config?.copilotSettings?.autoSuggest ? "active" : "inactive",
      dependsOn: 'copilot' as const,
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Instant notifications for ticket updates and assignments",
      status: config?.notificationSettings?.ticketCreation ? "active" : "inactive",
      dependsOn: 'notifications' as const,
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Collaborate on tickets with team members in dedicated channels",
      status: config?.connected ? "active" : "inactive",
      dependsOn: 'connected' as const,
    },
    {
      icon: Activity,
      title: "Dashboard Integration",
      description: "Access ServiceDesk dashboard directly within Teams interface",
      status: config?.connected ? "active" : "inactive",
      dependsOn: 'connected' as const,
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automated ticket routing and escalation through Teams",
      status: config?.copilotSettings?.smartRouting ? "active" : "inactive",
      dependsOn: 'copilot' as const,
    },
  ];

  const tabFeatures = [
    "Dashboard - Real-time overview of tickets and metrics",
    "Scheduler - Maintenance windows and team schedules",
    "Tech Availability Chart - Live technician status and workload",
    "Tasks - Team task management and assignments",
    "Reminders - Important follow-ups and deadlines",
    "Announcements - Team communications and updates",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-[#5483B3]" />
          <p className="text-gray-600">Loading Teams integration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 ml-auto flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-green-800 font-medium">Success!</p>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-600 hover:text-green-800 ml-auto flex-shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Microsoft Teams Integration
              </h2>
              <p className="text-gray-600 text-lg">
                Leverage Microsoft Teams as an additional channel for IT support with ServiceDesk Plus Cloud
              </p>
            </div>
            <button
              onClick={loadConfig}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#5483B3] to-[#3A5C80] rounded-xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Microsoft 365 Copilot Integration
                </h3>
                <p className={`text-lg font-medium ${config?.connected ? "text-[#5AB8A8]" : "text-[#D0857B]"}`}>
                  {config?.connected ? "✅ Connected and Active" : "❌ Disconnected"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {config?.connected 
                    ? "Your ServiceDesk is successfully integrated with Microsoft Teams"
                    : "Connect to enable Teams integration features"
                  }
                </p>
              </div>
            </div>
            <button
              onClick={config?.connected ? handleDisconnect : handleConnect}
              disabled={saving || loading}
              className={`px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2 transition-all ${
                config?.connected 
                  ? "bg-[#D0857B] hover:bg-[#c0756b] focus:ring-2 focus:ring-[#D0857B] focus:ring-offset-2" 
                  : "bg-[#5483B3] hover:bg-[#4A76A0] focus:ring-2 focus:ring-[#5483B3] focus:ring-offset-2"
              } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              <span>
                {config?.connected 
                  ? (saving ? "Disconnecting..." : "Disconnect") 
                  : (saving ? "Connecting..." : "Connect to Teams")
                }
              </span>
            </button>
          </div>

          {!config?.connected && (
            <div className="bg-[#F0F5FC] border border-[#7BA4D0] rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-[#5483B3] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-[#3A5C80] mb-2">Setup Instructions</h4>
                  <ol className="text-sm text-[#5483B3] space-y-1 list-decimal list-inside">
                    <li>Click "Connect to Teams" to start the integration process</li>
                    <li>You'll be redirected to Microsoft for authentication</li>
                    <li>Grant necessary permissions for ServiceDesk integration</li>
                    <li>Return to this page to configure your settings</li>
                  </ol>
                  {saving && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm">
                        <strong>Note:</strong> You are being redirected to Microsoft for authentication...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teams Tab Integration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-[#F0F5FC] rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#5483B3]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                ServiceDesk Plus Teams Tab
              </h3>
              <p className="text-gray-600">
                Full incident management module integrated as a Teams tab. Available when connected.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {tabFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-[#5AB8A8] flex-shrink-0" />
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {config?.connected 
                ? "The Teams tab is available in your Microsoft Teams workspace"
                : "Connect to Teams to enable the ServiceDesk tab"
              }
            </p>
            <button
              onClick={handleOpenInTeams}
              disabled={!config?.connected}
              className="flex items-center space-x-2 px-4 py-2 text-[#5483B3] hover:text-[#3A5C80] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              title={!config?.connected ? "Connect to Teams first" : "Open ServiceDesk in Teams"}
            >
              <ExternalLink className="w-4 h-4" />
              <span>
                {!config?.connected ? "Connect to Enable" : "Open in Teams"}
              </span>
            </button>
          </div>
        </div>

        {/* Integration Features */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Integration Features
            </h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#5AB8A8] rounded-full"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#D0857B] rounded-full"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrationFeatures.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = feature.status === "active";
              
              return (
                <div
                  key={index}
                  className={`border rounded-xl p-5 transition-all duration-200 ${
                    isActive
                      ? "border-[#5AB8A8] bg-[#f0f9f8] hover:bg-[#e0f3f1] shadow-sm"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100 opacity-75"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-[#5AB8A8]" : "bg-gray-300"
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        {feature.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isActive ? "bg-[#5AB8A8]" : "bg-[#D0857B]"
                          }`}
                        ></div>
                        <span
                          className={`text-xs font-medium ${
                            isActive ? "text-[#5AB8A8]" : "text-[#D0857B]"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Integration Settings
            </h3>
            {saving && (
              <div className="flex items-center space-x-2 text-[#5483B3]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Saving...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Notifications */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#F0F5FC] rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#5483B3]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Notification Settings</h4>
                  <p className="text-sm text-gray-600">Control how you receive Teams notifications</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {config && Object.entries(config.notificationSettings).map(([key, value]) => (
                  <label key={key} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() =>
                        handleNotificationChange(
                          key as keyof TeamsIntegrationConfig['notificationSettings']
                        )
                      }
                      disabled={!config.connected || saving}
                      className="mt-0.5 rounded border-gray-300 text-[#5483B3] focus:ring-[#5483B3] disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm block capitalize">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {key === 'ticketCreation' && 'Notify when new tickets are created'}
                        {key === 'statusUpdate' && 'Notify when ticket status changes'}
                        {key === 'assignment' && 'Notify when tickets are assigned to you'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Copilot */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-[#F0F5FC] rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-[#5483B3]" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Copilot Settings</h4>
                  <p className="text-sm text-gray-600">Configure AI-powered assistance features</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {config && Object.entries(config.copilotSettings).map(([key, value]) => (
                  <label key={key} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() =>
                        handleCopilotChange(key as keyof TeamsIntegrationConfig['copilotSettings'])
                      }
                      disabled={!config.connected || saving}
                      className="mt-0.5 rounded border-gray-300 text-[#5483B3] focus:ring-[#5483B3] disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900 text-sm block capitalize">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        {key === 'autoSuggest' && 'Enable AI suggestions for ticket resolution'}
                        {key === 'knowledgeBase' && 'Search knowledge base using natural language'}
                        {key === 'smartRouting' && 'Automatically route tickets based on AI analysis'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsIntegration;