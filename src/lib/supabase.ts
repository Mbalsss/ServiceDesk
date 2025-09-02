import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  type: 'incident' | 'service_request';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  subcategory?: string;
  assignee?: string;
  requester: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTechnician {
  id: string;
  name: string;
  email: string;
  status: 'available' | 'busy' | 'away' | 'offline';
  current_task?: string;
  workload: number;
  next_available?: string;
  updated_at: string;
}

export interface DatabaseTicketUpdate {
  id: string;
  ticket_id: string;
  author: string;
  content: string;
  update_type: 'comment' | 'status_change' | 'assignment' | 'escalation' | 'resolution';
  created_at: string;
}

export interface DatabaseMajorIncident {
  id: string;
  incident_number: string;
  title: string;
  description: string;
  severity: 'critical' | 'high';
  status: 'active' | 'investigating' | 'identified' | 'monitoring' | 'resolved';
  affected_services: string[];
  impacted_users: number;
  incident_commander: string;
  communication_channel?: string;
  start_time: string;
  estimated_resolution?: string;
  created_at: string;
  updated_at: string;
}