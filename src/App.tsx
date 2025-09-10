import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import CreateTicket from './components/CreateTicket';
import TicketDetails from './components/user/TicketDetails';
import Scheduler from './components/Scheduler';
import Tasks from './components/Tasks';
import Reminders from './components/Reminders';
import Announcements from './components/Announcements';
import Reports from './components/Reports';
import TeamsIntegration from './components/TeamsIntegration';
import CopilotAssistant from './components/CopilotAssistant';
import TechAvailability from './components/TechAvailability';
import Agents from './components/Agents';
import Automation from './components/Automation';
import Settings from './components/Settings';
import { ticketService } from './services/ticketService';
import { Ticket, DashboardStats, TechAvailability as TechAvailabilityType } from './types';
import LandingPage from './components/LandingPage'; // <-- Make sure this import is correct

// user components
import UserDashboard from './components/user/UserDashboard';
import MyTickets from './components/user/MyTickets';
import ProfileSettings from './components/user/ProfileSetting';
import ServiceDeskChatbot from './components/user/ChatBot';

// technician components
import TechnicianDashboard from './components/technician/TechnicianDashboard';
import AssignedTickets from './components/technician/AssignedTickets';
import UnassignedTicketsQueue from './components/technician/UnassignedTicketsQueue';
import PerformanceOverview from './components/technician/PerformanceOverview';
import TicketPage from './components/technician/TicketPage';
import FieldReport from './components/technician/FieldReport';
import { TeamsChatWrapper } from './components/technician/TeamsChat';
import KnowledgeBase from './components/technician/KnowlegdeBase';
import EquipmentManagement from './components/technician/EquipmentManagement';

// Updated User type to include department
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
  department?: string | null;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // Changed initial authView to 'landing'
  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>('landing');
  const [activeView, setActiveView] = useState('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedToday: 0,
    criticalTickets: 0,
  });
  const [technicians, setTechnicians] = useState<TechAvailabilityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTeamsChatOpen, setIsTeamsChatOpen] = useState(false);
  // Removed toggleTeamsChat as setIsTeamsChatOpen is passed directly

  // --------------------------
  // Fetch current user & profile
  // --------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setCurrentUser(null);
          setAuthView('landing'); // No user, show landing page
          setLoading(false);
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, department')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setCurrentUser(null);
          setAuthView('landing'); // Profile error, show landing
        } else if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            role: profile.role as 'admin' | 'technician' | 'user',
            department: profile.department || null,
          });
          setAuthView('login'); // User found, assume logged in (will render main app)
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
        setCurrentUser(null);
        setAuthView('landing'); // General error, show landing
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    // loadData() should only run if user is authenticated, handle this in render logic
  }, []);

  // Effect to handle data loading *after* user is authenticated
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]); // Run when currentUser changes (i.e., logs in)

  // --------------------------
  // Load tickets & stats
  // --------------------------
  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, statsData] = await Promise.all([
        ticketService.getAllTickets(),
        ticketService.getDashboardStats(),
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Auth handlers
  // --------------------------
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // After successful login, transition to the authenticated app view
    setActiveView('dashboard');
    setAuthView('login'); // Keep authView at 'login' or switch to a 'authenticated' state if preferred
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    // After successful signup, transition to the authenticated app view
    setActiveView('dashboard');
    setAuthView('login'); // Keep authView at 'login' or switch to a 'authenticated' state if preferred
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setActiveView('dashboard');
      setAuthView('landing'); // After logout, go back to landing page
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // --------------------------
  // Ticket creation handler
  // --------------------------
  const handleTicketCreate = async (data: {
    title: string;
    description: string;
    type: 'incident' | 'service_request';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    assignee_id?: string | null;
    image_url?: string | null;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
  }) => {
    if (!currentUser) return;

    try {
      const newTicket = await ticketService.createTicket({
        ...data,
        requester: currentUser.id,
      });

      if (newTicket) {
        setTickets([newTicket, ...tickets]);
        if (currentUser.role === 'user') {
          setActiveView('my_tickets');
        } else {
          setActiveView('tickets');
        }
      }
    } catch (err) {
      console.error('Ticket creation failed:', err);
    }
  };

  // --------------------------
  // Render content based on view & role
  // --------------------------
  const renderContent = () => {
    // This function will only be called if currentUser is NOT null,
    // due to the conditional rendering higher up.
    if (!currentUser) return null; // Defensive check, but should not be hit.

    switch (activeView) {
      case 'dashboard':
        if (currentUser.role === 'admin')
          return <Dashboard stats={stats} recentTickets={tickets} />;
        if (currentUser.role === 'technician')
          return <TechnicianDashboard currentUser={currentUser} onLogout={handleLogout} />;
        return <UserDashboard currentUser={currentUser} onLogout={handleLogout} />;

      case 'tickets':
        return (
          <TicketList
            tickets={tickets}
            onTicketSelect={(id) => {
              setSelectedTicketId(id);
              setActiveView('ticket-details');
            }}
            onTicketCreate={handleTicketCreate}
            currentUserName={currentUser.name}
          />
        );

      case 'scheduler':
        // FIX: Pass the currentUser prop here
        return <Scheduler currentUser={currentUser} initialEvents={[]} />; // Pass currentUser
      case 'tech-availability':
        return <TechAvailability technicians={technicians} onStatusUpdate={loadData} />;
      case 'tasks':
        return <Tasks tasks={[]} />;
      case 'reminders':
        return <Reminders reminders={[]} />;
      case 'announcements':
        return <Announcements announcements={[]} />;
      case 'reports':
        return <Reports />;
      case 'teams':
        return <TeamsIntegration />;
      case 'copilot':
        return <CopilotAssistant />;
      case 'agents':
        return <Agents technicians={technicians} onTechniciansChange={setTechnicians} />;
      case 'automation':
        return <Automation />;
      case 'settings':
        return <Settings />;
      case 'assigned_tickets':
        return <AssignedTickets currentUser={currentUser} onViewTicket={() => {}} />;
      case 'unassigned_tickets':
        return <UnassignedTicketsQueue
          currentUser={currentUser}
          onTicketTaken={loadData}
          onViewTicket={() => {}}
        />;
      case 'performance':
        return <PerformanceOverview assignedTickets={[]} />;
      case 'my_tickets': {
        const userTickets = tickets.filter(t => t.requester === currentUser.id);
        return (
          <MyTickets
            tickets={userTickets}
            onSelectTicket={() => {}}
            onOpenCreateTicket={() => setActiveView('create')}
          />
        );
      }
      case 'profile_settings':
        return <ProfileSettings
          currentUser={currentUser}
          onUpdate={(updatedUser) => console.log('Profile updated', updatedUser)}
        />;
      case 'create':
        return (
          <CreateTicket
            currentUser={currentUser}
            currentUserRole={currentUser.role}
            onTicketCreate={handleTicketCreate}
            onCancel={() => setActiveView('dashboard')}
          />
        );
      case 'ticket-details': {
        const selectedTicket = tickets.find(t => t.id === selectedTicketId);
        return selectedTicket ? (
          <TicketDetails ticket={selectedTicket} onBack={() => setActiveView('tickets')} />
        ) : <div className="p-6">Ticket not found</div>;
      };
      case 'ticketsPage':
        return (
          <TicketPage
            currentUser={currentUser}
            onViewTicket={(id) => {
              setSelectedTicketId(id);
              setActiveView('ticket-details');
            }}
          />
        );
      case 'knowledge_base':
        return <KnowledgeBase />;
      case 'field_report':
        return <FieldReport currentUser={currentUser} />;
      case 'equipment':
        return <EquipmentManagement />;

      default:
        return <div>Page not found.</div>;
    }
  };

  // --------------------------
  // Loading & auth screens (top-level rendering logic)
  // --------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ServiceDesk Plus Cloud...</p>
        </div>
      </div>
    );
  }

  // If no current user, display the appropriate auth view
  if (!currentUser) {
    if (authView === 'landing') {
      return (
        <LandingPage
          onStartLogin={() => setAuthView('login')}
          onStartSignup={() => setAuthView('signup')}
        />
      );
    } else if (authView === 'login') {
      return (
        <Login
          onLogin={handleLogin}
          onSwitchToSignup={() => setAuthView('signup')}
        />
      );
    } else if (authView === 'signup') {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    // Fallback if authView is somehow invalid
    return <LandingPage onStartLogin={() => setAuthView('login')} onStartSignup={() => setAuthView('signup')} />;
  }

  // --------------------------
  // Authenticated User (main application layout)
  // --------------------------
  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        logout={handleLogout}
        onOpenCreateTicket={handleTicketCreate} // Passed the actual handler for creation
        setChatOpen={setIsChatOpen} // For ServiceDeskChatbot
        setTeamsChatOpen={setIsTeamsChatOpen} // For TeamsChatWrapper
      />
      <div className="flex-1 flex flex-col relative">
        {currentUser.role === 'admin' && ( // Only show Header for admin? Consider for all roles.
          <Header currentUser={currentUser.name} onLogout={handleLogout} />
        )}
        <main className="flex-1 overflow-auto bg-gray-50"> {/* Added bg-gray-50 for consistent background */}
          {renderContent()}
        </main>
        {isChatOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            <ServiceDeskChatbot onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>
      {isTeamsChatOpen && (
        <TeamsChatWrapper
          teamId="<YOUR_TEAM_ID>"
          channelId="<YOUR_CHANNEL_ID>"
        />
      )}
    </div>
  );
}

export default App;