"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Bell, Search, Settings, User, Trash2 } from "lucide-react"

interface HeaderProps {
  currentUser: string
  onLogout: () => void
}

interface Ticket {
  id: number
  title: string
}

interface Profile {
  name: string
  email: string
  phone: string
  password: string
  newPassword?: string
  preferences: string
  users: string
  picture: string | null
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [notifications, setNotifications] = useState<Ticket[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [activeSettingsPage, setActiveSettingsPage] = useState<string | null>(null)
  const [activeAccountPage, setActiveAccountPage] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    password: "",
    newPassword: "",
    preferences: "",
    users: "",
    picture: null,
  })

  const notifRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const serviceDeskData = [
    "Ticket #101 - Printer Issue",
    "Ticket #102 - Network Down",
    "Workflow - New Hire Setup",
    "User - John Doe",
    "System Integration - Slack",
  ]

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([])
    } else {
      const results = serviceDeskData.filter((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
      setSearchResults(results)
    }
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false)
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false)
        setActiveSettingsPage(null)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false)
        setActiveAccountPage(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleHomeClick = () => {
    console.log("Navigating to Dashboard...")
  }

  const addTicketNotification = (title: string) => {
    const newTicket: Ticket = { id: notifications.length + 1, title }
    setNotifications((prev) => [newTicket, ...prev])
  }

  const clearNotifications = () => setNotifications([])

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onload = () => {
        setProfile((prev) => ({ ...prev, picture: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const renderAccountPage = () => {
    switch (activeAccountPage) {
      case "updateProfile":
        return (
          <form className="space-y-2 text-sm mt-2">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300">
                {profile.picture ? (
                  <img src={profile.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-gray-600 m-auto" />
                )}
              </div>
              <input type="file" onChange={handleProfilePictureChange} className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border rounded p-1"
            />
            <input
              type="email"
              placeholder="Email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full border rounded p-1"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full border rounded p-1"
            />
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded">
              Save Profile
            </button>
          </form>
        )
      case "changePassword":
        return (
          <form className="space-y-2 text-sm mt-2">
            <input
              type="password"
              placeholder="Current Password"
              value={profile.password}
              onChange={(e) => setProfile({ ...profile, password: e.target.value })}
              className="w-full border rounded p-1"
            />
            <input
              type="password"
              placeholder="New Password"
              value={profile.newPassword}
              onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
              className="w-full border rounded p-1"
            />
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded">
              Change Password
            </button>
          </form>
        )
      case "managePreferences":
        return (
          <div className="text-sm mt-2">
            <textarea
              placeholder="Enter your preferences..."
              value={profile.preferences}
              onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
              className="w-full border rounded p-1"
            />
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded mt-2">
              Save Preferences
            </button>
          </div>
        )
      case "manageUsers":
        return (
          <div className="text-sm mt-2">
            <input
              type="text"
              placeholder="Add/Update User"
              value={profile.users}
              onChange={(e) => setProfile({ ...profile, users: e.target.value })}
              className="w-full border rounded p-1"
            />
            <button type="button" className="bg-blue-600 text-white px-3 py-1 rounded mt-2">
              Manage Users
            </button>
          </div>
        )
      case "saveAll":
        return <div className="text-sm mt-2 text-green-600 font-semibold">✅ All changes saved successfully!</div>
      case "logout":
        return (
          <div className="text-sm mt-2">
            <button 
              onClick={onLogout}
              className="bg-red-600 text-white px-3 py-1 rounded w-full"
            >
              Logout
            </button>
          </div>
        )
      default:
        return null
    }
  }

  const renderSettingsPage = () => {
    switch (activeSettingsPage) {
      case "preferences":
        return (
          <div className="mt-2 text-sm space-y-2">
            <label className="block">Theme:</label>
            <select className="border rounded w-full p-1">
              <option>Light</option>
              <option>Dark</option>
            </select>
            <label className="block mt-1">Notifications:</label>
            <select className="border rounded w-full p-1">
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
            <label className="block mt-1">Language:</label>
            <select className="border rounded w-full p-1">
              <option>English</option>
              <option>Spanish</option>
            </select>
          </div>
        )
      case "system":
        return (
          <div className="mt-2 text-sm space-y-2">
            <label className="block">Ticket Categories:</label>
            <input type="text" placeholder="Add/Edit category" className="border rounded w-full p-1" />
            <label className="block mt-1">Workflows:</label>
            <input type="text" placeholder="Create/Edit workflow" className="border rounded w-full p-1" />
            <label className="block mt-1">Integrations:</label>
            <input type="text" placeholder="Slack/Teams/Email" className="border rounded w-full p-1" />
          </div>
        )
      case "help":
        return (
          <div className="mt-2 text-sm space-y-2">
            <p>
              <a href="#" className="text-blue-600 underline">
                User Guides
              </a>
            </p>
            <p>
              <a href="#" className="text-blue-600 underline">
                FAQs
              </a>
            </p>
            <p>
              <a href="mailto:support@servicedesk.com" className="text-blue-600 underline">
                Contact Support
              </a>
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left empty now */}
        <div onClick={handleHomeClick} className="cursor-pointer"></div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets, workflows, users..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-60 overflow-y-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((item, i) => (
                    <div key={i} className="p-2 hover:bg-gray-100 cursor-pointer">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs flex items-center text-red-500 hover:underline"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Clear All
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
                    {notifications.map((ticket) => (
                      <li key={ticket.id} className="p-2 bg-gray-50 rounded hover:bg-gray-100">
                        {ticket.title}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No new notifications</p>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                setShowSettings(!showSettings)
                setActiveSettingsPage(null)
              }}
            >
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50">
                <ul className="space-y-1 text-sm text-gray-700">
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveSettingsPage("preferences")}
                  >
                    Preferences
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveSettingsPage("system")}
                  >
                    System Settings
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveSettingsPage("help")}
                  >
                    Help
                  </li>
                </ul>
                {renderSettingsPage()}
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative flex items-center space-x-2 pl-4 border-l border-gray-200" ref={profileRef}>
            <div className="flex items-center cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                {profile.picture ? (
                  <img src={profile.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-600 m-auto" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 ml-2">{currentUser}</span>
            </div>
            {showProfile && (
              <div className="absolute right-0 mt-12 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
                <h3 className="font-semibold text-gray-700 mb-2">Profile</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Logged in as: <span className="font-bold">{currentUser}</span>
                </p>
                <hr className="my-2" />
                <ul className="space-y-1 text-sm text-gray-700">
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveAccountPage("updateProfile")}
                  >
                    Update Profile
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveAccountPage("changePassword")}
                  >
                    Change Password
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveAccountPage("managePreferences")}
                  >
                    Manage Preferences
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => setActiveAccountPage("manageUsers")}
                  >
                    Manage Users
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer text-green-600"
                    onClick={() => setActiveAccountPage("saveAll")}
                  >
                    Save All Changes
                  </li>
                  <li
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer text-red-600"
                    onClick={() => setActiveAccountPage("logout")}
                  >
                    Logout
                  </li>
                </ul>
                {renderAccountPage()}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header