/*
  # Populate tables with sample data

  1. Sample Data
    - Add sample tickets with various statuses and priorities
    - Add sample technicians with different availability states
    - Add sample ticket updates for demonstration

  2. Data Coverage
    - Multiple ticket types (incident, service_request)
    - All priority levels (low, medium, high, critical)
    - All status types (open, in_progress, resolved, closed)
    - Various technician statuses and workloads
*/

-- Insert sample tickets
INSERT INTO tickets (ticket_number, title, description, type, priority, status, assignee, requester, category, subcategory) VALUES
  ('INC-2025001', 'Email server outage affecting entire organization', 'The main email server is completely down. No users can send or receive emails. This is affecting business operations significantly.', 'incident', 'critical', 'in_progress', 'John Smith', 'Sarah Manager (sarah.manager@company.com)', 'Email', 'Server Outage'),
  
  ('SR-2025001', 'New employee laptop setup', 'Need to set up a new laptop for incoming marketing coordinator. Requires standard software package and domain join.', 'service_request', 'medium', 'open', 'Lisa Rodriguez', 'HR Department (hr@company.com)', 'Hardware', 'Laptop Setup'),
  
  ('INC-2025002', 'VPN connection failures for remote workers', 'Multiple remote employees reporting inability to connect to company VPN. Error message: "Connection timeout".', 'incident', 'high', 'investigating', 'Mike Chen', 'Remote Team Lead (remote.lead@company.com)', 'Network', 'VPN'),
  
  ('SR-2025002', 'Office 365 license request for new team', 'Development team needs 5 additional Office 365 licenses for new hires starting next week.', 'service_request', 'medium', 'open', 'David Wilson', 'Dev Manager (dev.manager@company.com)', 'Software', 'Licensing'),
  
  ('INC-2025003', 'Printer network connectivity issues', 'Main office printer cannot be reached from network. Users getting "printer offline" errors.', 'incident', 'low', 'resolved', 'Emma Thompson', 'Office Admin (admin@company.com)', 'Hardware', 'Printer'),
  
  ('SR-2025003', 'Password reset for locked account', 'User account locked after multiple failed login attempts. Need immediate reset for critical project work.', 'service_request', 'high', 'in_progress', 'John Smith', 'Project Lead (project.lead@company.com)', 'User Management', 'Password Reset'),
  
  ('INC-2025004', 'Database performance degradation', 'Customer database queries running extremely slow. Response times increased from 2s to 30s average.', 'incident', 'high', 'monitoring', 'David Wilson', 'Database Admin (dba@company.com)', 'Database', 'Performance'),
  
  ('SR-2025004', 'Software installation request', 'Need Adobe Creative Suite installed on 3 workstations in design department.', 'service_request', 'low', 'open', 'Lisa Rodriguez', 'Design Team (design@company.com)', 'Software', 'Installation'),
  
  ('INC-2025005', 'Security breach attempt detected', 'Firewall logs showing suspicious activity from external IP addresses. Potential security threat.', 'incident', 'critical', 'active', 'Mike Chen', 'Security Team (security@company.com)', 'Security', 'Breach Attempt'),
  
  ('SR-2025005', 'Conference room AV equipment setup', 'Need to install and configure new projector and video conferencing equipment in Conference Room B.', 'service_request', 'medium', 'resolved', 'Emma Thompson', 'Facilities (facilities@company.com)', 'Hardware', 'AV Equipment');

-- Insert sample technicians (if not already exists)
INSERT INTO technicians (name, email, status, workload, current_task) VALUES
  ('John Smith', 'john.smith@company.com', 'busy', 85, 'Resolving email server outage'),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'available', 45, NULL),
  ('Mike Chen', 'mike.chen@company.com', 'busy', 90, 'Investigating VPN connectivity issues'),
  ('Lisa Rodriguez', 'lisa.rodriguez@company.com', 'available', 30, NULL),
  ('David Wilson', 'david.wilson@company.com', 'away', 0, NULL),
  ('Emma Thompson', 'emma.thompson@company.com', 'available', 60, 'Hardware maintenance'),
  ('Alex Kumar', 'alex.kumar@company.com', 'busy', 75, 'Database optimization'),
  ('Maria Garcia', 'maria.garcia@company.com', 'offline', 0, NULL)
ON CONFLICT (email) DO UPDATE SET
  status = EXCLUDED.status,
  workload = EXCLUDED.workload,
  current_task = EXCLUDED.current_task;

-- Insert sample ticket updates
INSERT INTO ticket_updates (ticket_id, author, content, update_type) 
SELECT 
  t.id,
  'John Smith',
  'Initial investigation started. Checking server logs and connectivity.',
  'status_change'
FROM tickets t 
WHERE t.ticket_number = 'INC-2025001';

INSERT INTO ticket_updates (ticket_id, author, content, update_type)
SELECT 
  t.id,
  'Mike Chen',
  'VPN server restart completed. Testing connections with affected users.',
  'comment'
FROM tickets t 
WHERE t.ticket_number = 'INC-2025002';

INSERT INTO ticket_updates (ticket_id, author, content, update_type)
SELECT 
  t.id,
  'Emma Thompson',
  'Printer network cable was loose. Reconnected and tested successfully.',
  'resolution'
FROM tickets t 
WHERE t.ticket_number = 'INC-2025003';

INSERT INTO ticket_updates (ticket_id, author, content, update_type)
SELECT 
  t.id,
  'David Wilson',
  'Database indexing completed. Performance improved significantly.',
  'comment'
FROM tickets t 
WHERE t.ticket_number = 'INC-2025004';

INSERT INTO ticket_updates (ticket_id, author, content, update_type)
SELECT 
  t.id,
  'Mike Chen',
  'Firewall rules updated. Blocking suspicious IP ranges. Monitoring continues.',
  'escalation'
FROM tickets t 
WHERE t.ticket_number = 'INC-2025005';