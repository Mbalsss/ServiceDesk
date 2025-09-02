import React, { useState } from "react";
import {
  MessageSquare,
  Bot,
  Zap,
  CheckCircle,
  Settings,
  Users,
  Bell,
  Activity,
} from "lucide-react";

const TeamsIntegration: React.FC = () => {
  // ✅ Track connection state
  const [connected, setConnected] = useState(true);

  // ✅ Track settings state
  const [notificationSettings, setNotificationSettings] = useState({
    ticketCreation: true,
    statusUpdate: true,
    assignment: true,
  });

  const [copilotSettings, setCopilotSettings] = useState({
    autoSuggest: true,
    knowledgeBase: true,
    smartRouting: true,
  });

  // ✅ Feature status
  const integrationFeatures = [
    {
      icon: MessageSquare,
      title: "Chat Support",
      description:
        "Enable end users to create and track tickets directly through Teams chat",
      status: connected ? "active" : "inactive",
    },
    {
      icon: Bot,
      title: "Microsoft 365 Copilot",
      description:
        "AI-powered assistance for ticket resolution and knowledge base queries",
      status: copilotSettings.autoSuggest ? "active" : "inactive",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Instant notifications for ticket updates and assignments",
      status: notificationSettings.ticketCreation ? "active" : "inactive",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Collaborate on tickets with team members in dedicated channels",
      status: connected ? "active" : "inactive",
    },
    {
      icon: Activity,
      title: "Dashboard Integration",
      description:
        "Access ServiceDesk dashboard directly within Teams interface",
      status: connected ? "active" : "inactive",
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automated ticket routing and escalation through Teams",
      status: copilotSettings.smartRouting ? "active" : "inactive",
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

  // ✅ Toggle helpers
  const handleNotificationChange = (key: keyof typeof notificationSettings) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopilotChange = (key: keyof typeof copilotSettings) => {
    setCopilotSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Microsoft Teams Integration
        </h2>
        <p className="text-gray-600">
          Leverage Microsoft Teams as an additional channel for IT support with
          ServiceDesk Plus Cloud
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Microsoft 365 Copilot Integration
              </h3>
              <p
                className={`font-medium ${
                  connected ? "text-green-600" : "text-red-600"
                }`}
              >
                {connected ? "Connected and Active" : "Disconnected"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConnected(!connected)}
            className={`px-4 py-2 rounded-lg text-white ${
              connected ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {connected ? "Disconnect" : "Connect"}
          </button>
        </div>
      </div>

      {/* Teams Tab Integration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              ServiceDesk Plus Teams Tab
            </h3>
            <p className="text-gray-600">
              Full incident management module integrated as a Teams tab
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {tabFeatures.map((feature, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Features */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Integration Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {feature.title}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          feature.status === "active"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      ></div>
                      <span
                        className={`text-xs font-medium ${
                          feature.status === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {feature.status}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Integration Settings
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Notifications */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Notification Settings
            </h4>
            <div className="space-y-2">
              {Object.entries(notificationSettings).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      handleNotificationChange(
                        key as keyof typeof notificationSettings
                      )
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Copilot */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Copilot Settings</h4>
            <div className="space-y-2">
              {Object.entries(copilotSettings).map(([key, value]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      handleCopilotChange(key as keyof typeof copilotSettings)
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {key.replace(/([A-Z])/g, " $1")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsIntegration;
