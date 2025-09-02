import { Ticket, User, DashboardStats } from '../types';
import { TechAvailability, Task, Reminder, Announcement, ScheduleEvent, MajorIncident, IncidentUpdate } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'John Doe', email: 'john.doe@company.com', role: 'agent', department: 'IT Support' },
  { id: '2', name: 'Jane Smith', email: 'jane.smith@company.com', role: 'admin', department: 'IT Support' },
  { id: '3', name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'requester', department: 'Sales' },
  { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', role: 'agent', department: 'IT Support' },
];

export const mockTickets: Ticket[] = [
  {
    id: 'INC-001',
    title: 'Email server down - urgent',
    description: 'The email server is not responding. Multiple users affected.',
    type: 'incident',
    priority: 'critical',
    status: 'in_progress',
    assignee: 'John Doe',
    requester: 'Mike Johnson',
    createdAt: new Date('2025-01-08T09:15:00'),
    updatedAt: new Date('2025-01-08T10:30:00'),
    category: 'Email',
    subcategory: 'Server Issues'
  },
  {
    id: 'SR-002',
    title: 'New user account setup',
    description: 'Please create a new user account for the new hire in marketing department.',
    type: 'service_request',
    priority: 'medium',
    status: 'open',
    assignee: 'Sarah Wilson',
    requester: 'Jane Smith',
    createdAt: new Date('2025-01-08T08:45:00'),
    updatedAt: new Date('2025-01-08T08:45:00'),
    category: 'User Management',
    subcategory: 'Account Creation'
  },
  {
    id: 'INC-003',
    title: 'VPN connection issues',
    description: 'Unable to connect to VPN from home office. Getting timeout errors.',
    type: 'incident',
    priority: 'high',
    status: 'open',
    assignee: 'John Doe',
    requester: 'Mike Johnson',
    createdAt: new Date('2025-01-08T07:20:00'),
    updatedAt: new Date('2025-01-08T07:20:00'),
    category: 'Network',
    subcategory: 'VPN'
  },
  {
    id: 'SR-004',
    title: 'Software license renewal',
    description: 'Need to renew Office 365 licenses for the entire development team.',
    type: 'service_request',
    priority: 'medium',
    status: 'resolved',
    assignee: 'Sarah Wilson',
    requester: 'Jane Smith',
    createdAt: new Date('2025-01-07T14:30:00'),
    updatedAt: new Date('2025-01-08T09:00:00'),
    category: 'Software',
    subcategory: 'Licensing'
  },
  {
    id: 'INC-005',
    title: 'Printer not working',
    description: 'Office printer on 3rd floor is showing paper jam error but no paper is stuck.',
    type: 'incident',
    priority: 'low',
    status: 'closed',
    assignee: 'John Doe',
    requester: 'Mike Johnson',
    createdAt: new Date('2025-01-07T11:15:00'),
    updatedAt: new Date('2025-01-07T16:45:00'),
    category: 'Hardware',
    subcategory: 'Printers'
  }
];

export const mockStats: DashboardStats = {
  totalTickets: 45,
  openTickets: 12,
  inProgressTickets: 8,
  resolvedToday: 5,
  criticalTickets: 2
};

export const mockTechAvailability: TechAvailability[] = [
  {
    id: '1',
    name: 'John Doe',
    status: 'available',
    workload: 65,
    currentTask: 'Email server maintenance'
  },
  {
    id: '2',
    name: 'Jane Smith',
    status: 'busy',
    workload: 90,
    currentTask: 'Critical incident resolution',
    nextAvailable: new Date('2025-01-08T15:30:00')
  },
  {
    id: '3',
    name: 'Sarah Wilson',
    status: 'available',
    workload: 45,
    currentTask: 'User account setup'
  },
  {
    id: '4',
    name: 'Mike Johnson',
    status: 'away',
    workload: 0,
    nextAvailable: new Date('2025-01-08T14:00:00')
  }
];

export const mockTasks: Task[] = [
];

export const mockReminders: Reminder[] = [
];

export const mockAnnouncements: Announcement[] = [
];

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: 'S-001',
    title: 'Server Maintenance',
    description: 'Routine maintenance on production servers',
    startTime: new Date('2025-01-15T02:00:00'),
    endTime: new Date('2025-01-15T04:00:00'),
    type: 'maintenance',
    assignee: 'John Doe',
    location: 'Data Center'
  },
  {
    id: 'S-002',
    title: 'Security Training',
    description: 'Mandatory security awareness training session',
    startTime: new Date('2025-01-10T10:00:00'),
    endTime: new Date('2025-01-10T12:00:00'),
    type: 'training',
    assignee: 'All Staff',
    location: 'Conference Room A'
  },
  {
    id: 'S-003',
    title: 'On-Call Shift',
    description: 'Weekend on-call support coverage',
    startTime: new Date('2025-01-11T18:00:00'),
    endTime: new Date('2025-01-12T08:00:00'),
    type: 'on_call',
    assignee: 'Sarah Wilson'
  }
];

export const mockMajorIncidents: MajorIncident[] = [
];