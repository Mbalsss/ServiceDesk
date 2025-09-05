import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BarChart3, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface TicketType {
  id: string;
  status: string;
  priority: string;
  assignee_id?: string;
  requester_id?: string;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
}

const PerformanceOverview: React.FC = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndTickets = async () => {
      setLoading(true);

      // 1️⃣ Get session user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('No logged-in user:', userError);
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        console.error('Failed to fetch profile:', profileError);
        setLoading(false);
        return;
      }

      setCurrentUser(profile);

      // 3️⃣ Fetch tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setLoading(false);
        return;
      }

      // 4️⃣ Filter tickets based on role
      let visibleTickets = ticketsData || [];
      if (profile.role !== 'admin') {
        visibleTickets = visibleTickets.filter(
          (t) => t.assignee_id === profile.id || t.requester_id === profile.id
        );
      }

      setTickets(visibleTickets);
      setLoading(false);
    };

    fetchUserAndTickets();
  }, []);

  if (loading) return <div className="p-6">Loading performance metrics...</div>;

  // Key metrics
  const total = tickets.length;
  const resolved = tickets.filter((t) => t.status === 'resolved').length;
  const pending = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
  const now = new Date();
  const overdue = tickets.filter(
    (t) =>
      t.sla_deadline &&
      new Date(t.sla_deadline) < now &&
      !['resolved', 'closed'].includes(t.status)
  ).length;
  const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

  // Status & Priority breakdown
  const statusBreakdown = ['open', 'in_progress', 'resolved', 'closed'].reduce((acc, status) => {
    acc[status] = tickets.filter((t) => t.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const priorityBreakdown = ['critical', 'high', 'medium', 'low'].reduce((acc, p) => {
    acc[p] = tickets.filter((t) => t.priority === p).length;
    return acc;
  }, {} as Record<string, number>);

  const getPercentage = (value: number) => (total > 0 ? (value / total) * 100 : 0);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-800">Performance Overview</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center">
          <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-blue-800 mb-1">{resolved}</h3>
          <p className="text-blue-600 font-medium">Resolved</p>
          <p className="text-sm text-blue-500 mt-1">{getPercentage(resolved).toFixed(0)}% of total</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-5 text-center">
          <Clock className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-yellow-800 mb-1">{pending}</h3>
          <p className="text-yellow-600 font-medium">Pending</p>
          <p className="text-sm text-yellow-500 mt-1">{getPercentage(pending).toFixed(0)}% of total</p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-red-800 mb-1">{overdue}</h3>
          <p className="text-red-600 font-medium">Overdue</p>
          <p className="text-sm text-red-500 mt-1">{pending > 0 ? ((overdue / pending) * 100).toFixed(0) : 0}% of pending</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
          <TrendingUp className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h3 className="text-2xl font-bold text-green-800 mb-1">{resolutionRate.toFixed(0)}%</h3>
          <p className="text-green-600 font-medium">Resolution Rate</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Ticket Status Breakdown</h3>
        {Object.entries(statusBreakdown).map(([status, count]) => (
          <div key={status} className="mb-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-gray-600">{status.replace('_', ' ')}</span>
              <span className="text-gray-800 font-medium">{count} ({getPercentage(count).toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  { open: 'bg-blue-500', in_progress: 'bg-orange-500', resolved: 'bg-green-500', closed: 'bg-gray-500' }[status]
                }`}
                style={{ width: `${getPercentage(count)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Priority Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-4">Priority Distribution</h3>
        {Object.entries(priorityBreakdown).map(([priority, count]) => (
          <div key={priority} className="mb-2">
            <div className="flex justify-between text-sm">
              <span className="capitalize text-gray-600">{priority}</span>
              <span className="text-gray-800 font-medium">{count} ({getPercentage(count).toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-gray-500' }[priority]
                }`}
                style={{ width: `${getPercentage(count)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceOverview;
