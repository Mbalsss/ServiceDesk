import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import CreateTicket from './components/CreateTicket';
import TicketDetails from './components/TicketDetails';
import Scheduler from './components/Scheduler';
import Tasks from './components/Tasks';
import Reminders from './components/Reminders';
import Announcements from './components/Announcements';
import Reports from './components/Reports';
import TeamsIntegration from './components/TeamsIntegration';
import ChatBot from './components/ChatBot';
import CopilotAssistant from './components/CopilotAssistant';
import TechAvailability from './components/TechAvailability';
import FieldReport from './components/FieldReport';
import Agents from './components/Agents';
import Automation from './components/Automation';
import Settings from './components/Settings';
import { ticketService } from './services/ticketService';
import { technicianService } from './services/technicianService';
import { 
  mockUsers, 
  mockScheduleEvents, 
  mockTasks, 
  mockReminders, 
  mockAnnouncements,
  mockMajorIncidents
} from './utils/mockData';
import { Ticket, DashboardStats, TechAvailability as TechAvailabilityType } from './types';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedToday: 0,
    criticalTickets: 0
  });
  const [technicians, setTechnicians] = useState<TechAvailabilityType[]>([
    { id: '1', name: 'Dumile Soga', status: 'available', role: 'Manager' },
    { id: '2', name: 'Rethabile Ntsekhe', status: 'busy', role: 'Backend' },
    { id: '3', name: 'Petlo Matabane', status: 'away', role: 'Frontend' },
    { id: '4', name: 'Monica Ndlovu', status: 'offline', role: 'Customer Support' }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const currentUser = mockUsers[0].name;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ticketsData, statsData, techniciansData] = await Promise.all([
        ticketService.getAllTickets(),
        ticketService.getDashboardStats(),
        technicianService.getAllTechnicians()
      ]);
      setTickets(ticketsData);
      setStats(statsData);
      // Keep your custom technicians instead of overriding
      // setTechnicians(techniciansData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard stats={stats} recentTickets={tickets} />;
      case 'tickets':
        return <TicketList tickets={tickets} onTicketSelect={(id) => setSelectedTicketId(id)} />;
      case 'create':
        return <CreateTicket onTicketCreate={async (data) => setTickets([...(await ticketService.createTicket(data)), ...tickets])} />;
      case 'ticket-details':
        const selectedTicket = tickets.find(t => t.id === selectedTicketId);
        return selectedTicket ? <TicketDetails ticket={selectedTicket} onBack={() => setSelectedTicketId(null)} /> : <p>Ticket not found</p>;
      case 'chatbot':
        return <ChatBot onTicketCreate={() => {}} />;
      case 'major-incidents':
        return <Announcements announcements={mockMajorIncidents} />;
      case 'scheduler':
        return <Scheduler events={mockScheduleEvents} />;
      case 'tech-availability':
        return <TechAvailability technicians={technicians} onStatusUpdate={async () => loadData()} />;
      case 'field-report':
        return <FieldReport technicianName={currentUser} />;
      case 'tasks':
        return <Tasks tasks={mockTasks} />;
      case 'reminders':
        return <Reminders reminders={mockReminders} />;
      case 'announcements':
        return <Announcements announcements={mockAnnouncements} />;
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
      default:
        return <Dashboard stats={stats} recentTickets={tickets} />;
    }
  };

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

  return (
    <div className="min-h-screen flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 flex flex-col">
        <Header currentUser={currentUser} />
        <main className="flex-1 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
}

export default App;
