/*
  # Add technicians table

  1. New Tables
    - `technicians`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `status` (text, default 'available')
      - `current_task` (text, nullable)
      - `workload` (integer, default 0)
      - `next_available` (timestamptz, nullable)
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `technicians` table
    - Add policies for authenticated users to read and update technician data

  3. Sample Data
    - Insert sample technicians for testing
*/

-- Create technicians table
CREATE TABLE IF NOT EXISTS technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  status text DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away', 'offline')),
  current_task text,
  workload integer DEFAULT 0 CHECK (workload >= 0 AND workload <= 100),
  next_available timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view technicians"
  ON technicians
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can update technicians"
  ON technicians
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_technicians_status ON technicians(status);
CREATE INDEX IF NOT EXISTS idx_technicians_workload ON technicians(workload);

-- Insert sample technicians
INSERT INTO technicians (name, email, status, workload, current_task) VALUES
  ('John Smith', 'john.smith@company.com', 'available', 45, 'Network maintenance'),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'busy', 85, 'Server migration project'),
  ('Mike Chen', 'mike.chen@company.com', 'available', 30, NULL),
  ('Lisa Rodriguez', 'lisa.rodriguez@company.com', 'away', 0, NULL),
  ('David Wilson', 'david.wilson@company.com', 'available', 60, 'Database optimization'),
  ('Emma Thompson', 'emma.thompson@company.com', 'offline', 0, NULL)
ON CONFLICT (email) DO NOTHING;