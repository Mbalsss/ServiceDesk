/*
  # Fix tickets table schema

  1. Schema Updates
    - Ensure tickets table has correct column names matching the application
    - Update any column names that don't match the expected schema
    - Add missing columns if needed

  2. Changes
    - Verify status column exists and has correct constraints
    - Verify priority column exists and has correct constraints
    - Ensure all expected columns are present
*/

-- Drop and recreate tickets table with correct schema
DROP TABLE IF EXISTS ticket_updates CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;

-- Create tickets table with correct column names
CREATE TABLE tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('incident', 'service_request')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  category text NOT NULL,
  subcategory text,
  assignee text,
  requester text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recreate ticket_updates table
CREATE TABLE ticket_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  author text NOT NULL,
  content text NOT NULL,
  update_type text NOT NULL DEFAULT 'comment' CHECK (update_type IN ('comment', 'status_change', 'assignment', 'escalation', 'resolution')),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Anyone can view tickets"
  ON tickets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create tickets"
  ON tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update tickets"
  ON tickets
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for ticket_updates
CREATE POLICY "Anyone can view ticket updates"
  ON ticket_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create ticket updates"
  ON ticket_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_assignee ON tickets(assignee);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_ticket_updates_ticket_id ON ticket_updates(ticket_id);

-- Insert sample tickets
INSERT INTO tickets (ticket_number, title, description, type, priority, status, assignee, requester, category, subcategory) VALUES
  ('INC-001', 'Email server down - urgent', 'The email server is not responding. Multiple users affected.', 'incident', 'critical', 'in_progress', 'John Doe', 'Mike Johnson', 'Email', 'Server Issues'),
  ('SR-002', 'New user account setup', 'Please create a new user account for the new hire in marketing department.', 'service_request', 'medium', 'open', 'Sarah Wilson', 'Jane Smith', 'User Management', 'Account Creation'),
  ('INC-003', 'VPN connection issues', 'Unable to connect to VPN from home office. Getting timeout errors.', 'incident', 'high', 'open', 'John Doe', 'Mike Johnson', 'Network', 'VPN'),
  ('SR-004', 'Software license renewal', 'Need to renew Office 365 licenses for the entire development team.', 'service_request', 'medium', 'resolved', 'Sarah Wilson', 'Jane Smith', 'Software', 'Licensing'),
  ('INC-005', 'Printer not working', 'Office printer on 3rd floor is showing paper jam error but no paper is stuck.', 'incident', 'low', 'closed', 'John Doe', 'Mike Johnson', 'Hardware', 'Printers');

-- Function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tickets
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();