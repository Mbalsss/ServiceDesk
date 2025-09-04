export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: 'incident' | 'service_request';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignee: string;
  requester: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'admin' | 'requester';
  department?: string;
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedToday: number;
  criticalTickets: number;
}

export interface TechAvailability {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  currentTask?: string;
  nextAvailable?: Date;
  workload: number; // percentage
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  relatedTicket?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  type: 'ticket_followup' | 'maintenance' | 'meeting' | 'general';
  isCompleted: boolean;
  assignee: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
  category: 'maintenance' | 'policy' | 'system_update' | 'general';
  isActive: boolean;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'maintenance' | 'meeting' | 'training' | 'on_call';
  assignee: string;
  location?: string;
}

export interface IncidentUpdate {
  id: string;
  ticketId: string;
  author: string;
  content: string;
  timestamp: Date;
  type: 'status_change' | 'assignment' | 'comment' | 'resolution' | 'escalation';
  visibility: 'internal' | 'public';
}

export interface AdaptiveCard {
  id: string;
  ticketId: string;
  type: 'assignment' | 'status_update' | 'resolution' | 'escalation';
  title: string;
  content: any;
  actions: AdaptiveCardAction[];
  createdAt: Date;
}

export interface AdaptiveCardAction {
  type: 'Action.Submit' | 'Action.OpenUrl';
  title: string;
  data?: any;
  url?: string;
}

export interface MajorIncident {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high';
  status: 'active' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affectedServices: string[];
  impactedUsers: number;
  startTime: Date;
  estimatedResolution?: Date;
  incidentCommander: string;
  communicationChannel: string;
  updates: IncidentUpdate[];
  workarounds: string[];
  relatedTickets: string[];
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  teamsNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: {
    ticketAssignment: boolean;
    statusUpdates: boolean;
    majorIncidents: boolean;
    escalations: boolean;
    reminders: boolean;
  };
}