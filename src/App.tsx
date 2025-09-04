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
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
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

  // Chatbot open state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // --------------------------
  // Fetch current user & profile
  // --------------------------
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setCurrentUser(null);
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
        } else if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name || profile.email, // fallback
            email: profile.email,
            role: profile.role as 'admin' | 'technician' | 'user',
            department: profile.department || null,
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    loadData();
  }, []);

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
  const handleLogin = (user: User) => setCurrentUser(user);
  const handleSignup = (user: User) => setCurrentUser(user);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setActiveView('dashboard');
      setAuthView('login');
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
    if (!currentUser) return null;

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
        return <Scheduler events={[]} />;
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
       case 'ticketsPage': // This now correctly matches the ID from your Sidebar's technician menu
        return (
          <TicketPage
            currentUser={currentUser}
            onViewTicket={(id) => {
              setSelectedTicketId(id);
              setActiveView('ticket-details'); // Or a dedicated technician ticket details view if different
            }}
          />
        );
        case 'field_report': // Add this new case
        return <FieldReport currentUser={currentUser} />;
      default:
        return <div>Page not found.</div>;
    }
  };

  // --------------------------
  // Loading & auth screens
  // --------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading ServiceDesk Plus Cloud...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return authView === 'login' ? (
      <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />
    ) : (
      <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentUser={currentUser}
        activeView={activeView}
        onViewChange={setActiveView}
        logout={handleLogout}
        onOpenCreateTicket={() => setActiveView('create')}
        setChatOpen={setIsChatOpen} // This correctly sets the state to true
      />
      <div className="flex-1 flex flex-col relative">
        {/* Conditional rendering for the Header */}
        {currentUser.role === 'admin' && (
          <Header currentUser={currentUser.name} onLogout={handleLogout} />
        )}
        <main className="flex-1 overflow-auto">{renderContent()}</main>
        {/* Chatbot is rendered conditionally based on isChatOpen state */}
        {isChatOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            {/* Ensure onClose correctly sets isChatOpen to false */}
            <ServiceDeskChatbot onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;