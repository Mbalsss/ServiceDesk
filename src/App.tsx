// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';

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
import TeamsCallback from './components/TeamsCallback'; // ADD THIS IMPORT
import CopilotAssistant from './components/CopilotAssistant';
import TechAvailability from './components/TechAvailability';
import Agents from './components/Agents';
import Automation from './components/Automation';
import Settings from './components/Settings';
import { ticketService } from './services/ticketService';
import { Ticket, DashboardStats, TechAvailability as TechAvailabilityType } from './types';
import LandingPage from './components/LandingPage';
import Portal from './components/Portal';
import SetupPassword from './components/SetupPassword';

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

// NEW: Import UserManagement component
import UserManagement from './components/UserManagement';

// Updated User type
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'user';
  department?: string | null;
}

// Custom hook for chatbot state management
const useChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    console.log('Opening chatbot');
    setIsOpen(true);
  };

  const close = () => {
    console.log('Closing chatbot');
    setIsOpen(false);
  };

  const toggle = () => {
    console.log('Toggling chatbot', !isOpen);
    setIsOpen(prev => !prev);
  };

  return { isOpen, open, close, toggle };
};

// Custom hook for copilot state management
const useCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    console.log('Opening copilot');
    setIsOpen(true);
  };

  const close = () => {
    console.log('Closing copilot');
    setIsOpen(false);
  };

  const toggle = () => {
    console.log('Toggling copilot', !isOpen);
    setIsOpen(prev => !prev);
  };

  return { isOpen, open, close, toggle };
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  
  // Use custom hooks for chat state management
  const supportChat = useChatbot();
  const copilot = useCopilot();

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch current user & profile
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
          setCurrentUser(null);
        } else if (profile) {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name || profile.email,
            email: profile.email,
            role: profile.role as 'admin' | 'technician' | 'user',
            department: profile.department || null,
          });
        }
      } catch (err) {
        console.error('Unexpected error fetching user:', err);
        setCurrentUser(null);
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
    // Redirect to appropriate dashboard based on role
    navigate('/dashboard');
  };

  const handleSignup = (user: User) => {
    setCurrentUser(user);
    // Redirect to appropriate dashboard based on role
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      // Close all chat windows before logout
      supportChat.close();
      copilot.close();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      // Redirect to landing page after logout
      navigate('/');
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

  // Loading screen
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

  return (
    <Routes>
      {/* Public Routes - Accessible without authentication */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={
        currentUser ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Login onLogin={handleLogin} onSwitchToSignup={() => navigate('/signup')} />
        )
      } />
      <Route path="/signup" element={
        currentUser ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <Signup onSignup={handleSignup} onSwitchToLogin={() => navigate('/login')} />
        )
      } />
      <Route path="/setup-password" element={<SetupPassword />} />
      
      {/* ADD THIS ROUTE - Teams OAuth Callback (Public) */}
      <Route path="/teams/callback" element={<TeamsCallback />} />

      {/* Protected Routes - Require authentication */}
      <Route path="/*" element={
        currentUser ? (
          <AuthenticatedLayout 
            currentUser={currentUser}
            tickets={tickets}
            stats={stats}
            technicians={technicians}
            onLogout={handleLogout}
            onTicketCreate={handleTicketCreate}
            isCreateTicketModalOpen={isCreateTicketModalOpen}
            setIsCreateTicketModalOpen={setIsCreateTicketModalOpen}
            supportChat={supportChat}
            copilot={copilot}
          />
        ) : (
          <Navigate to="/" replace />
        )
      } />
    </Routes>
  );
}

// Separate component for authenticated layout
interface AuthenticatedLayoutProps {
  currentUser: User;
  tickets: Ticket[];
  stats: DashboardStats;
  technicians: TechAvailabilityType[];
  onLogout: () => void;
  onTicketCreate: (data: any) => void;
  isCreateTicketModalOpen: boolean;
  setIsCreateTicketModalOpen: (open: boolean) => void;
  supportChat: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
  copilot: {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
  };
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({
  currentUser,
  tickets,
  stats,
  technicians,
  onLogout,
  onTicketCreate,
  isCreateTicketModalOpen,
  setIsCreateTicketModalOpen,
  supportChat,
  copilot,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Protected Route component for admin-only routes
  const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return currentUser.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar
        currentUser={currentUser}
        activeView={location.pathname}
        onViewChange={(view) => navigate(view)}
        logout={onLogout}
        onOpenCreateTicket={() => setIsCreateTicketModalOpen(true)}
        setChatOpen={supportChat.toggle}
        setTeamsChatOpen={copilot.toggle}
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
                <TechnicianDashboard currentUser={currentUser} onLogout={onLogout} /> :
                <UserDashboard currentUser={currentUser} onLogout={onLogout} />
            } />
            
            {/* Teams Integration Route */}
            <Route path="/teams" element={<TeamsIntegration />} />
            
            {/* Ticket Routes */}
            <Route path="/tickets" element={
              <TicketList 
                tickets={tickets} 
                onTicketSelect={(id) => navigate(`/ticket/${id}`)} 
                currentUserName={currentUser.name} 
              />
            } />

            {/* Technician Ticket List Page */}
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
                onTicketTaken={() => window.location.reload()} 
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
            
            {/* NEW: User Management Route (Admin only) */}
            <Route path="/admin/users" element={
              <AdminRoute>
                <UserManagement />
              </AdminRoute>
            } />
            
            {/* Other Routes */}
            <Route path="/scheduler" element={<Scheduler currentUser={currentUser} initialEvents={[]} />} />
            <Route path="/tech-availability" element={<TechAvailability technicians={technicians} onStatusUpdate={() => window.location.reload()} />} />
            <Route path="/profile-settings" element={<ProfileSettings currentUser={currentUser} onUpdate={(updatedUser) => console.log('Profile updated', updatedUser)} />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/field-report" element={<FieldReport currentUser={currentUser} />} />
            <Route path="/equipment" element={<EquipmentManagement />} />
            <Route path="/performance" element={<PerformanceOverview assignedTickets={[]} />} />
            <Route path="/announcements" element={<Announcements announcements={[]} />} />
            <Route path="/agents" element={<Agents technicians={technicians} onTechniciansChange={() => {}} />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/copilot" element={<CopilotAssistant />} />
            <Route path="/tasks" element={<Tasks tasks={[]} />} />
            <Route path="/reminders" element={<Reminders reminders={[]} />} />

            {/* Default redirect for authenticated users */}
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
              onTicketCreate(ticket);
              setIsCreateTicketModalOpen(false);
            }}
            onCancel={() => setIsCreateTicketModalOpen(false)}
          />
        )}

        {/* Chat components using Portal */}
        {supportChat.isOpen && (
          <Portal>
            <div className="fixed bottom-6 right-6 z-50">
              <ServiceDeskChatbot 
                onClose={() => {
                  console.log('Closing chatbot from Portal');
                  supportChat.close();
                }} 
              />
            </div>
          </Portal>
        )}

        {copilot.isOpen && (
          <Portal>
            <div className="fixed bottom-6 right-80 z-50">
              <CopilotAssistant 
                onClose={() => {
                  console.log('Closing copilot from Portal');
                  copilot.close();
                }} 
              />
            </div>
          </Portal>
        )}
      </div>
    </div>
  );
};

export default App;