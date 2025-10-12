import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

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

interface UserProfile {
  id: string;
  role: string;
  full_name?: string;
}

const PerformanceOverview: React.FC = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserAndTickets = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Get session user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error(userError?.message || 'No logged-in user');
        }

        // 2️⃣ Fetch profile with role - only request existing columns
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          throw new Error(profileError?.message || 'Failed to fetch profile');
        }

        setCurrentUser(profile);

        // 3️⃣ Build query based on role
        let query = supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false });

        // Filter tickets based on role
        if (profile.role !== 'admin') {
          query = query.or(`assignee_id.eq.${profile.id},requester_id.eq.${profile.id}`);
        }

        const { data: ticketsData, error: ticketsError } = await query;

        if (ticketsError) {
          throw new Error(ticketsError.message);
        }

        setTickets(ticketsData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTickets();
  }, []);

  // Calculate metrics
  const totalTickets = tickets.length;
  const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;
  const pendingTickets = tickets.filter((t) => ['open', 'in_progress'].includes(t.status)).length;
  
  const now = new Date();
  const overdueTickets = tickets.filter(
    (t) =>
      t.sla_deadline &&
      new Date(t.sla_deadline) < now &&
      !['resolved', 'closed'].includes(t.status)
  ).length;
  
  const resolutionRate = totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0;
  const overdueRate = pendingTickets > 0 ? (overdueTickets / pendingTickets) * 100 : 0;

  // Status breakdown
  const statusBreakdown = {
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  // Priority breakdown
  const priorityBreakdown = {
    critical: tickets.filter(t => t.priority === 'critical').length,
    high: tickets.filter(t => t.priority === 'high').length,
    medium: tickets.filter(t => t.priority === 'medium').length,
    low: tickets.filter(t => t.priority === 'low').length,
  };

  const getPercentage = (value: number) => (totalTickets > 0 ? (value / totalTickets) * 100 : 0);

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center p-6 sm:p-8 bg-white rounded-lg shadow-sm border border-[#7BA4D0]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5483B3] mb-4 sm:mb-0 sm:mr-3"></div>
          <span className="text-sm sm:text-base text-black text-center sm:text-left">Loading performance metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="text-center text-[#D0857B] p-6 sm:p-8 bg-white rounded-lg shadow-sm border border-[#7BA4D0]">
          <h3 className="text-base sm:text-lg font-medium mb-2 text-black">Error Loading Data</h3>
          <p className="text-sm sm:text-base break-words px-2 text-black">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header - Simplified without icons */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-black">Performance Overview</h2>
        <p className="text-xs sm:text-sm text-black mt-1">
          {currentUser?.role === 'admin' ? 'All tickets' : 'Your assigned tickets'} • {totalTickets} total tickets
        </p>
      </div>

      {/* Key Metrics Grid - Simplified without icons */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <MetricCard
          title="Resolved"
          value={resolvedTickets}
          percentage={getPercentage(resolvedTickets)}
          description="of total tickets"
        />
        
        <MetricCard
          title="Pending"
          value={pendingTickets}
          percentage={getPercentage(pendingTickets)}
          description="of total tickets"
        />
        
        <MetricCard
          title="Overdue"
          value={overdueTickets}
          percentage={overdueRate}
          description="of pending tickets"
        />
        
        <MetricCard
          title="Resolution Rate"
          value={resolutionRate.toFixed(1)}
          percentage={resolutionRate}
          description="overall success rate"
          isRate={true}
        />
      </div>

      {/* Empty State */}
      {totalTickets === 0 && (
        <div className="mb-6 sm:mb-8">
          <div className="text-center py-8 sm:py-12 text-black border-2 border-dashed border-[#7BA4D0] rounded-lg bg-white px-4">
            <h3 className="text-base sm:text-lg font-medium text-black mb-2">No tickets found</h3>
            <p className="text-xs sm:text-sm text-black">There are no tickets matching your current filters.</p>
          </div>
        </div>
      )}

      {/* Breakdown Sections */}
      {totalTickets > 0 && (
        <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-1 xl:grid-cols-2 sm:gap-6">
          {/* Status Breakdown */}
          <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-[#7BA4D0]">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Ticket Status Breakdown
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      status === 'open' ? 'bg-[#5483B3]' :
                      status === 'in_progress' ? 'bg-[#7BA4D0]' :
                      status === 'resolved' ? 'bg-[#5AB8A8]' : 'bg-[#3A5C80]'
                    }`}></div>
                    <span className="text-sm font-medium text-black capitalize truncate">
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
                    <span className="text-sm font-semibold text-black whitespace-nowrap text-xs sm:text-sm">
                      {count}
                    </span>
                    <div className="w-12 sm:w-16 lg:w-20 bg-[#F0F5FC] rounded-full h-2 flex-shrink-0">
                      <div
                        className={`h-2 rounded-full ${
                          status === 'open' ? 'bg-[#5483B3]' :
                          status === 'in_progress' ? 'bg-[#7BA4D0]' :
                          status === 'resolved' ? 'bg-[#5AB8A8]' : 'bg-[#3A5C80]'
                        }`}
                        style={{ width: `${getPercentage(count)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-black w-6 sm:w-8 text-right whitespace-nowrap flex-shrink-0">
                      {getPercentage(count).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-[#7BA4D0]">
            <h3 className="text-base sm:text-lg font-semibold text-black mb-3 sm:mb-4">
              Priority Distribution
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(priorityBreakdown).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      priority === 'critical' ? 'bg-[#D0857B]' :
                      priority === 'high' ? 'bg-[#5AB8A8]' :
                      priority === 'medium' ? 'bg-[#7BA4D0]' : 'bg-[#5483B3]'
                    }`}></div>
                    <span className="text-sm font-medium text-black capitalize truncate">
                      {priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
                    <span className="text-sm font-semibold text-black whitespace-nowrap text-xs sm:text-sm">
                      {count}
                    </span>
                    <div className="w-12 sm:w-16 lg:w-20 bg-[#F0F5FC] rounded-full h-2 flex-shrink-0">
                      <div
                        className={`h-2 rounded-full ${
                          priority === 'critical' ? 'bg-[#D0857B]' :
                          priority === 'high' ? 'bg-[#5AB8A8]' :
                          priority === 'medium' ? 'bg-[#7BA4D0]' : 'bg-[#5483B3]'
                        }`}
                        style={{ width: `${getPercentage(count)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-black w-6 sm:w-8 text-right whitespace-nowrap flex-shrink-0">
                      {getPercentage(count).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified Metric Card Component without icons
interface MetricCardProps {
  title: string;
  value: string | number;
  percentage: number;
  description: string;
  isRate?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  percentage,
  description,
  isRate = false
}) => {
  return (
    <div className="bg-white border border-[#7BA4D0] rounded-xl p-3 sm:p-4 lg:p-5 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="text-sm font-medium text-black">
          {title}
        </div>
        <span className="text-xs font-semibold text-[#5483B3] px-2 py-1 rounded-full bg-[#F0F5FC] border border-[#7BA4D0] text-xs sm:text-sm">
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div className="space-y-1">
        <h3 className="text-xl sm:text-2xl font-bold text-black">
          {isRate ? `${value}%` : value}
        </h3>
        <p className="text-xs text-black mt-1 sm:mt-2">
          {description}
        </p>
      </div>
    </div>
  );
};

export default PerformanceOverview;