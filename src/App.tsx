// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { NotificationProvider } from './components/contexts/NotificationContext';

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
import Portal from './components/Portal';

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
import TicketPage from './components/technician/TicketPage'; // ✅ only import once
import FieldReport from './components/technician/FieldReport';
import EquipmentManagement from './components/technician/EquipmentManagement';

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

  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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
    navigate('/dashboard');
    setAuthView('login');
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    navigate('/dashboard');
    setAuthView('login');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      navigate('/');
      setAuthView('landing');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Ticket creation handler
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
        navigate(currentUser.role === 'user' ? '/my-tickets' : '/tickets');
      }
    } catch (err) {
      console.error('Ticket creation failed:', err);
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
    <NotificationProvider>
      <div className="min-h-screen flex">
        <Sidebar
          currentUser={currentUser}
          activeView={location.pathname}
          onViewChange={(view) => navigate(view)}
          logout={handleLogout}
          onOpenCreateTicket={() => setIsCreateTicketModalOpen(true)}
          setChatOpen={setIsSupportChatOpen}
          setCopilotOpen={setIsCopilotOpen}
        />
        
        {/* Main content with margin for fixed sidebar */}
        <div className="flex-1 flex flex-col relative ml-64">
          <Header currentUser={currentUser.name} />
          <main className="flex-1 overflow-auto bg-gray-50">
            <Routes>
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={
                currentUser.role === 'admin' ? 
                  <Dashboard stats={stats} recentTickets={tickets} /> :
                currentUser.role === 'technician' ? 
                  <TechnicianDashboard currentUser={currentUser} onLogout={handleLogout} /> :
                  <UserDashboard currentUser={currentUser} onLogout={handleLogout} />
              } />
              
              {/* Ticket Routes */}
              <Route path="/tickets" element={
                <TicketList 
                  tickets={tickets} 
                  onTicketSelect={(id) => navigate(`/ticket/${id}`)} 
                  currentUserName={currentUser.name} 
                />
              } />

              {/* ✅ Technician Ticket List Page */}
              <Route path="/ticketpage" element={
                <TicketPage 
                  tickets={tickets} 
                  currentUser={currentUser} 
                />
              } />
              
              <Route path="/ticket/:id" element={
                currentUser.role === 'technician' ? 
                  <TicketPage 
                    ticket={tickets.find(t => t.id === location.pathname.split('/').pop())} 
                    onBack={() => navigate('/assigned-tickets')} 
                  /> :
                  <TicketDetails 
                    ticket={tickets.find(t => t.id === location.pathname.split('/').pop())} 
                    onBack={() => navigate(currentUser.role === 'user' ? '/my-tickets' : '/tickets')} 
                    currentUser={currentUser}
                  />
              } />
              
              {/* Technician Routes */}
              <Route path="/assigned-tickets" element={
                <AssignedTickets 
                  currentUser={currentUser} 
                  onViewTicket={(id) => navigate(`/ticket/${id}`)} 
                />
              } />
              
              <Route path="/unassigned-tickets" element={
                <UnassignedTicketsQueue 
                  currentUser={currentUser} 
                  onTicketTaken={loadData} 
                  onViewTicket={(id) => navigate(`/ticket/${id}`)} 
                />
              } />
              
              {/* User Routes */}
              <Route path="/my-tickets" element={
                <MyTickets 
                  tickets={tickets.filter(t => t.requester === currentUser.id)} 
                  onSelectTicket={(id) => navigate(`/ticket/${id}`)} 
                  onOpenCreateTicket={() => setIsCreateTicketModalOpen(true)}
                  currentUser={currentUser}
                />
              } />
              
              {/* Other Routes */}
              <Route path="/scheduler" element={<Scheduler currentUser={currentUser} initialEvents={[]} />} />
              <Route path="/tech-availability" element={<TechAvailability technicians={technicians} onStatusUpdate={loadData} />} />
              <Route path="/profile-settings" element={<ProfileSettings currentUser={currentUser} onUpdate={(updatedUser) => console.log('Profile updated', updatedUser)} />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/field-report" element={<FieldReport currentUser={currentUser} />} />
              <Route path="/equipment" element={<EquipmentManagement />} />
              <Route path="/performance" element={<PerformanceOverview assignedTickets={[]} />} />
              <Route path="/announcements" element={<Announcements announcements={[]} />} />
              <Route path="/agents" element={<Agents technicians={technicians} onTechniciansChange={setTechnicians} />} />
              <Route path="/automation" element={<Automation />} />
              <Route path="/teams" element={<TeamsIntegration />} />
              <Route path="/copilot" element={<CopilotAssistant />} />
              <Route path="/tasks" element={<Tasks tasks={[]} />} />
              <Route path="/reminders" element={<Reminders reminders={[]} />} />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="p-6">Page not found.</div>} />
            </Routes>
          </main>

          {/* Modals */}
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
        </div>

        {/* Chat components using Portal */}
        {isSupportChatOpen && (
          <Portal>
            <div className="fixed bottom-6 right-6 z-50">
              <ServiceDeskChatbot onClose={() => setIsSupportChatOpen(false)} />
            </div>
          </Portal>
        )}

        {isCopilotOpen && (
          <Portal>
            <div className="fixed bottom-6 right-80 z-50">
              <CopilotAssistant onClose={() => setIsCopilotOpen(false)} />
            </div>
          </Portal>
        )}
      </div>
    </NotificationProvider>
  );
}

export default App;
