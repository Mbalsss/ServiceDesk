// src/App.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; // Existing Supabase import
import { NotificationProvider } from './components/contexts/NotificationContext'; // .tsx extension is optional in imports

// Import your components
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
import LandingPage from './components/LandingPage';

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
import EquipmentManagement from './components/technician/EquipmentManagement';
import TicketsPage from './components/technician/TicketPage';


// Updated User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
  department?: string | null;
}

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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

  // Modal state for CreateTicket
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  // State for chat components
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Fetch current user & profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCurrentUser(null);
          setAuthView('landing');
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
          setAuthView('landing');
        } else if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            role: profile.role as 'admin' | 'technician' | 'user',
            department: profile.department || null,
          });
          setAuthView('login');
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
        setCurrentUser(null);
        setAuthView('landing');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

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

  // Auth handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
    setAuthView('login');
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    setActiveView('dashboard');
    setAuthView('login');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      setActiveView('dashboard');
      setAuthView('landing');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Ticket handlers
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
        setActiveView(currentUser.role === 'user' ? 'my_tickets' : 'tickets');
      }
    } catch (err) {
      console.error('Ticket creation failed:', err);
    }
  };

  // Render content based on view & role
  const renderContent = () => {
    if (!currentUser) return null;

    switch (activeView) {
      case 'dashboard':
        if (currentUser.role === 'admin') return <Dashboard stats={stats} recentTickets={tickets} />;
        if (currentUser.role === 'technician') return <TechnicianDashboard currentUser={currentUser} onLogout={handleLogout} />;
        return <UserDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case 'tickets':
        return <TicketList tickets={tickets} onTicketSelect={(id) => { setSelectedTicketId(id); setActiveView('ticket-details'); }} currentUserName={currentUser.name} />;
      case 'assigned_tickets':
        return <AssignedTickets currentUser={currentUser} onViewTicket={(id) => { setSelectedTicketId(id); setActiveView('ticket-details'); }} />;
      case 'unassigned_tickets':
        return <UnassignedTicketsQueue currentUser={currentUser} onTicketTaken={loadData} onViewTicket={(id) => { setSelectedTicketId(id); setActiveView('ticket-details'); }} />;
      case 'performance':
        return <PerformanceOverview assignedTickets={[]} />;
      case 'field_report':
      return <FieldReport currentUser={currentUser} />;
      case 'equipment':
        return <EquipmentManagement />;
      case 'scheduler':
        return <Scheduler currentUser={currentUser} initialEvents={[]} />;
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
      case 'my_tickets':
        const userTickets = tickets.filter(t => t.requester === currentUser.id);
        return (
          <MyTickets 
            tickets={userTickets} 
            onSelectTicket={(id) => { 
              setSelectedTicketId(id); 
              setActiveView('ticket-details'); 
            }} 
            onOpenCreateTicket={() => setIsCreateTicketModalOpen(true)}
            currentUser={currentUser} // Fixed: Added currentUser prop
          />
        );
      case 'profile_settings':
        return <ProfileSettings currentUser={currentUser} onUpdate={(updatedUser) => console.log('Profile updated', updatedUser)} />;
      case 'tickets_page':
        return <TicketsPage currentUser={currentUser} />;
      case 'ticket-details':
        const selectedTicket = tickets.find(t => t.id === selectedTicketId);
        if (currentUser.role === 'technician') {
          return <TicketPage ticket={selectedTicket} onBack={() => setActiveView('assigned_tickets')} />;
        } else {
          return selectedTicket ? (
            <TicketDetails 
              ticket={selectedTicket} 
              onBack={() => setActiveView(currentUser.role === 'user' ? 'my_tickets' : 'tickets')} 
              currentUser={currentUser} // Added currentUser prop for consistency
            />
          ) : (
            <div className="p-6">Ticket not found</div>
          );
        }
      default:
        return <div className="p-6">Page not found.</div>;
    }
  };

  // Loading & auth screens
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

  if (!currentUser) {
    if (authView === 'landing') return <LandingPage onStartLogin={() => setAuthView('login')} onStartSignup={() => setAuthView('signup')} />;
    if (authView === 'login') return <Login onLogin={handleLogin} onSwitchToSignup={() => setAuthView('signup')} />;
    if (authView === 'signup') return <Signup onSignup={handleSignup} onSwitchToLogin={() => setAuthView('login')} />;
    return <LandingPage onStartLogin={() => setAuthView('login')} onStartSignup={() => setAuthView('signup')} />;
  }

  // Authenticated layout
  return (
    // Wrap the entire authenticated part with NotificationProvider
    <NotificationProvider> {/* <-- NEW: NotificationProvider */}
      <div className="min-h-screen flex">
        <Sidebar
          currentUser={currentUser}
          activeView={activeView}
          onViewChange={setActiveView}
          logout={handleLogout}
          onOpenCreateTicket={() => setIsCreateTicketModalOpen(true)}
          setChatOpen={setIsSupportChatOpen}
          setCopilotOpen={setIsCopilotOpen}
        />
        <div className="flex-1 flex flex-col relative">
          {/* Header now receives currentUser.name, and we don't pass onLogout directly to Header */}
          <Header currentUser={currentUser.name} /> {/* MODIFIED: No onLogout prop here */}
          <main className="flex-1 overflow-auto bg-gray-50">{renderContent()}</main>

          {/* Create Ticket Modal */}
          {isCreateTicketModalOpen && (
            <CreateTicket
              currentUser={currentUser}
              currentUserRole={currentUser.role}
              onTicketCreate={(ticket) => {
                handleTicketCreate(ticket);
                setIsCreateTicketModalOpen(false);
              }}
              onCancel={() => setIsCreateTicketModalOpen(false)}
            />
          )}

          {/* Chat components */}
          {isSupportChatOpen && (
            <div className="fixed bottom-6 right-6 z-50">
              <ServiceDeskChatbot onClose={() => setIsSupportChatOpen(false)} />
            </div>
          )}

          {isCopilotOpen && (
            <div className="fixed bottom-6 right-80 z-50">
              <CopilotAssistant onClose={() => setIsCopilotOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </NotificationProvider> // <-- NEW: NotificationProvider closes
  );
}

export default App;