import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Clock, 
  Activity, 
  AlertTriangle, 
  ChevronRight, 
  TrendingUp, 
  UserCheck, 
  BarChart3,
  CheckCircle,
  AlertCircle,
  PieChart,
  Users,
  Wrench,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // Your Supabase client

interface DashboardProps {
  // Props if needed
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  criticalTickets: number;
  totalUsers: number;
  totalEquipment: number;
  maintenanceDue: number;
  slaCompliance: number;
  escalatedTickets: number;
  avgResolutionTime: string;
}

interface TicketType {
  id: string;
  title: string;
  requester: string;
  priority: string;
  status: string;
  created_at: string;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    criticalTickets: 0,
    totalUsers: 0,
    totalEquipment: 0,
    maintenanceDue: 0,
    slaCompliance: 0,
    escalatedTickets: 0,
    avgResolutionTime: '0h'
  });
  
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [ticketTrends, setTicketTrends] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    checkDatabaseStructure(); // For debugging
  }, []);

  const checkDatabaseStructure = async () => {
    try {
      console.log('Checking database structure...');
      
      // Check if tickets table has data
      const { count: ticketCount, error: ticketError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });
      
      if (ticketError) {
        console.error('Error accessing tickets table:', ticketError);
      } else {
        console.log('Total tickets in database:', ticketCount);
      }
      
      // Check if profiles table has data
      const { count: profileCount, error: profileError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (profileError) {
        console.error('Error accessing profiles table:', profileError);
      } else {
        console.log('Total profiles in database:', profileCount);
      }
      
      // Check closed tickets
      const { count: closedCount, error: closedError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed');
      
      if (closedError) {
        console.error('Error checking closed tickets:', closedError);
      } else {
        console.log('Closed tickets:', closedCount);
      }
      
      // Check tickets with assignees
      const { count: assignedCount, error: assignedError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .not('assignee_id', 'is', null)
        .eq('status', 'closed');
      
      if (assignedError) {
        console.error('Error checking assigned tickets:', assignedError);
      } else {
        console.log('Closed tickets with assignees:', assignedCount);
      }
      
    } catch (error) {
      console.error('Error checking database structure:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [
        ticketsData,
        usersData,
        equipmentData,
        maintenanceData,
        ticketTrendsData,
        categoryStats,
        performerStats,
        slaData
      ] = await Promise.all([
        fetchTicketsData(),
        fetchUsersData(),
        fetchEquipmentData(),
        fetchMaintenanceData(),
        fetchTicketTrends(),
        fetchCategoryStats(),
        fetchTopPerformers(),
        fetchSlaData()
      ]);

      // Process and set the data
      setStats({
        totalTickets: ticketsData.total,
        openTickets: ticketsData.open,
        inProgressTickets: ticketsData.inProgress,
        criticalTickets: ticketsData.critical,
        totalUsers: usersData,
        totalEquipment: equipmentData.total,
        maintenanceDue: maintenanceData,
        slaCompliance: slaData.compliance,
        escalatedTickets: slaData.escalated,
        avgResolutionTime: slaData.avgResolution
      });

      setRecentTickets(ticketsData.recent);
      setTicketTrends(ticketTrendsData);
      setCategoryData(categoryStats);
      setTopPerformers(performerStats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketsData = async () => {
    try {
      // Get total tickets
      const { count: total, error: totalError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;

      // Get open tickets
      const { count: open, error: openError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      
      if (openError) throw openError;

      // Get in-progress tickets
      const { count: inProgress, error: progressError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');
      
      if (progressError) throw progressError;

      // Get critical tickets
      const { count: critical, error: criticalError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'critical');
      
      if (criticalError) throw criticalError;

      // Get recent tickets with requester info
      const { data: recentTicketsData, error: recentError } = await supabase
        .from('tickets')
        .select(`
          id,
          title,
          priority,
          status,
          created_at,
          profiles!tickets_requester_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentError) throw recentError;

      // Format recent tickets
      const formattedRecentTickets = recentTicketsData?.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        priority: ticket.priority,
        status: ticket.status,
        created_at: ticket.created_at,
        requester: ticket.profiles?.full_name || 'Unknown'
      })) || [];

      return {
        total: total || 0,
        open: open || 0,
        inProgress: inProgress || 0,
        critical: critical || 0,
        recent: formattedRecentTickets
      };
    } catch (error) {
      console.error('Error fetching tickets data:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        critical: 0,
        recent: []
      };
    }
  };

  const fetchUsersData = async () => {
    try {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching users data:', error);
      return 0;
    }
  };

  const fetchEquipmentData = async () => {
    try {
      // Get total equipment
      const { count: total, error: totalError } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;

      return {
        total: total || 0
      };
    } catch (error) {
      console.error('Error fetching equipment data:', error);
      return {
        total: 0
      };
    }
  };

  const fetchMaintenanceData = async () => {
    try {
      // Get equipment due for maintenance (next_maintenance_date is in the past or within 7 days)
      const { data, error } = await supabase
        .from('equipment')
        .select('id, next_maintenance_date, status')
        .lte('next_maintenance_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .neq('status', 'retired');
      
      if (error) {
        console.error('Error fetching maintenance data:', error);
        return 0;
      }
      
      console.log('Maintenance due data:', data);
      return data?.length || 0;
    } catch (error) {
      console.error('Error in fetchMaintenanceData:', error);
      return 0;
    }
  };

  const fetchTicketTrends = async () => {
    try {
      // Get ticket counts for the last 7 days
      const { data, error } = await supabase
        .from('tickets')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('Error fetching ticket trends:', error);
        // Return default empty data
        return [
          { day: 'Sun', tickets: 0 },
          { day: 'Mon', tickets: 0 },
          { day: 'Tue', tickets: 0 },
          { day: 'Wed', tickets: 0 },
          { day: 'Thu', tickets: 0 },
          { day: 'Fri', tickets: 0 },
          { day: 'Sat', tickets: 0 }
        ];
      }

      console.log('Ticket trends raw data:', data);

      // Group by day
      const dailyCounts: { [key: string]: number } = {};
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      // Initialize with zeros for the last 7 days
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayKey = days[date.getDay()];
        dailyCounts[dayKey] = 0;
      }

      // Count tickets per day
      data?.forEach(ticket => {
        const date = new Date(ticket.created_at);
        const dayKey = days[date.getDay()];
        dailyCounts[dayKey] = (dailyCounts[dayKey] || 0) + 1;
      });

      // Convert to array format in correct order (Sun to Sat)
      const result = days.map(day => ({
        day,
        tickets: dailyCounts[day] || 0
      }));

      console.log('Processed ticket trends:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchTicketTrends:', error);
      return [
        { day: 'Sun', tickets: 0 },
        { day: 'Mon', tickets: 0 },
        { day: 'Tue', tickets: 0 },
        { day: 'Wed', tickets: 0 },
        { day: 'Thu', tickets: 0 },
        { day: 'Fri', tickets: 0 },
        { day: 'Sat', tickets: 0 }
      ];
    }
  };

  const fetchCategoryStats = async () => {
    try {
      // Get ticket counts by category
      const { data, error } = await supabase
        .from('tickets')
        .select('category')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      // Count by category
      const categoryCounts: { [key: string]: number } = {};
      data?.forEach(ticket => {
        categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
      });

      // Map to colors
      const colorMap: { [key: string]: string } = {
        software: 'bg-blue-500',
        hardware: 'bg-green-500',
        network: 'bg-yellow-500',
        access: 'bg-purple-500',
        other: 'bg-gray-500'
      };

      const result = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({
          category,
          count,
          color: colorMap[category] || 'bg-gray-500'
        }));

      console.log('Category stats:', result);
      return result;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return [];
    }
  };

  const fetchTopPerformers = async () => {
    try {
      console.log('Fetching top performers...');
      
      // First, check if we have any closed tickets
      const { count: closedCount, error: countError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed')
        .not('assignee_id', 'is', null)
        .gte('closed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      console.log('Closed tickets with assignees in last 30 days:', closedCount);
      
      if (closedCount === 0 || closedCount === null) {
        return [];
      }
      
      // Get the actual ticket data with assignee information
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          assignee_id,
          closed_at,
          profiles!tickets_assignee_id_fkey(id, full_name)
        `)
        .eq('status', 'closed')
        .not('assignee_id', 'is', null)
        .gte('closed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) {
        console.error('Error fetching ticket data:', error);
        
        // If the join fails, try getting data separately
        return await fetchTopPerformersSeparately();
      }
      
      console.log('Fetched ticket data with profiles:', data);
      
      // Count resolved tickets per technician
      const technicianCounts: { [key: string]: { count: number, name: string } } = {};
      
      data?.forEach(ticket => {
        if (ticket.assignee_id) {
          const techId = ticket.assignee_id;
          if (!technicianCounts[techId]) {
            technicianCounts[techId] = {
              count: 0,
              name: ticket.profiles?.full_name || `Technician ${techId.substring(0, 8)}`
            };
          }
          technicianCounts[techId].count += 1;
        }
      });
      
      console.log('Technician counts:', technicianCounts);
      
      // Convert to array and sort
      const performers = Object.entries(technicianCounts)
        .map(([id, { name, count }]) => ({ id, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      console.log('Final top performers:', performers);
      return performers;
      
    } catch (error) {
      console.error('Error in fetchTopPerformers:', error);
      return [];
    }
  };

  const fetchTopPerformersSeparately = async () => {
    try {
      console.log('Fetching data separately...');
      
      // Get ticket data without join
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('assignee_id, closed_at')
        .eq('status', 'closed')
        .not('assignee_id', 'is', null)
        .gte('closed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        return [];
      }
      
      console.log('Raw tickets data:', ticketsData);
      
      // Count tickets per assignee
      const assigneeCounts: { [key: string]: number } = {};
      ticketsData?.forEach(ticket => {
        if (ticket.assignee_id) {
          assigneeCounts[ticket.assignee_id] = (assigneeCounts[ticket.assignee_id] || 0) + 1;
        }
      });
      
      console.log('Assignee counts:', assigneeCounts);
      
      // Get profile information for these assignees
      const assigneeIds = Object.keys(assigneeCounts);
      if (assigneeIds.length === 0) {
        return [];
      }
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assigneeIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return [];
      }
      
      console.log('Profiles data:', profilesData);
      
      // Combine the data
      const performers = assigneeIds.map(assigneeId => {
        const profile = profilesData?.find(p => p.id === assigneeId);
        return {
          id: assigneeId,
          name: profile?.full_name || `Technician ${assigneeId.substring(0, 8)}`,
          count: assigneeCounts[assigneeId]
        };
      }).sort((a, b) => b.count - a.count).slice(0, 3);
      
      console.log('Final performers with separate queries:', performers);
      return performers;
      
    } catch (error) {
      console.error('Error in fetchTopPerformersSeparately:', error);
      return [];
    }
  };

  const fetchSlaData = async () => {
    try {
      // Calculate SLA compliance (tickets closed before SLA deadline)
      const { data: closedTickets, error } = await supabase
        .from('tickets')
        .select('created_at, closed_at, sla_deadline, priority')
        .not('sla_deadline', 'is', null)
        .not('closed_at', 'is', null);
      
      if (error) {
        console.error('Error fetching SLA data:', error);
        return {
          compliance: 0,
          avgResolution: '0h',
          escalated: 0
        };
      }

      console.log('SLA raw data:', closedTickets);

      let compliant = 0;
      let total = 0;
      let totalHours = 0;
      let resolvedCount = 0;
      let escalated = 0;
      
      closedTickets?.forEach(ticket => {
        // Count SLA compliance
        total++;
        if (ticket.closed_at && ticket.sla_deadline && 
            new Date(ticket.closed_at) <= new Date(ticket.sla_deadline)) {
          compliant++;
        }
        
        // Calculate resolution time
        if (ticket.created_at && ticket.closed_at) {
          const created = new Date(ticket.created_at);
          const closed = new Date(ticket.closed_at);
          const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
          totalHours += hours;
          resolvedCount++;
        }
        
        // Count escalated tickets (high and critical priority)
        if (ticket.priority === 'high' || ticket.priority === 'critical') {
          escalated++;
        }
      });

      const result = {
        compliance: total > 0 ? Math.round((compliant / total) * 100) : 0,
        avgResolution: resolvedCount > 0 ? `${Math.round(totalHours / resolvedCount)}h` : '0h',
        escalated: escalated
      };

      console.log('SLA calculated result:', result);
      return result;
    } catch (error) {
      console.error('Error in fetchSlaData:', error);
      return {
        compliance: 0,
        avgResolution: '0h',
        escalated: 0
      };
    }
  };

  const getPriorityPillColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  // Overview cards - using real data from stats
  const overviewCards = [
    { title: 'Total Tickets', value: stats.totalTickets, icon: Ticket, color: 'blue' },
    { title: 'Open Tickets', value: stats.openTickets, icon: Clock, color: 'orange' },
    { title: 'In Progress', value: stats.inProgressTickets, icon: Activity, color: 'yellow' },
    { title: 'Critical Incidents', value: stats.criticalTickets, icon: AlertTriangle, color: 'red' }
  ];

  // System metrics - using real data from stats
  const systemMetrics = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'indigo' },
    { title: 'Total Equipment', value: stats.totalEquipment, icon: Wrench, color: 'gray' },
    { title: 'Maintenance Due', value: stats.maintenanceDue, icon: Calendar, color: 'amber' }
  ];

  // Performance metrics - using real data from stats
  const performanceMetrics = [
    { title: 'SLA Compliance', value: `${stats.slaCompliance}%`, icon: CheckCircle, color: 'green' },
    { title: 'Escalated Tickets', value: stats.escalatedTickets, icon: AlertCircle, color: 'red' },
    { title: 'Avg. Resolution Time', value: stats.avgResolutionTime, icon: Clock, color: 'blue' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive overview of service desk performance and metrics.
          </p>
        </div>

        {/* Overview Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewCards.map(card => {
            const Icon = card.icon;
            const colorClass = `text-${card.color}-600`;
            const bgClass = `bg-${card.color}-100`;
            
            return (
              <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center gap-5">
                <div className={`p-3 rounded-lg ${bgClass}`}>
                  <Icon className={`w-7 h-7 ${colorClass}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* System Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {systemMetrics.map(metric => {
            const Icon = metric.icon;
            const colorClass = `text-${metric.color}-600`;
            const bgClass = `bg-${metric.color}-100`;
            
            return (
              <div key={metric.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center gap-5">
                <div className={`p-3 rounded-lg ${bgClass}`}>
                  <Icon className={`w-7 h-7 ${colorClass}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{metric.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance & Trends Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Ticket Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Ticket Trends (Last 7 Days)</h2>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-end space-x-2 justify-around">
              {ticketTrends.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors"
                    style={{ height: `${Math.max(10, item.tickets * 10)}px` }}
                    title={`${item.tickets} tickets`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Performance Metrics</h2>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {performanceMetrics.map(metric => {
                const Icon = metric.icon;
                const colorClass = `text-${metric.color}-600`;
                const bgClass = `bg-${metric.color}-100`;
                
                return (
                  <div key={metric.title} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${bgClass}`}>
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                        <p className="text-xl font-bold text-gray-800">{metric.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Focus Areas Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Top Issue Categories */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Top Issue Categories (Last 30 Days)</h2>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.category}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count} tickets</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Top Performers (Last 30 Days)</h2>
              <UserCheck className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {topPerformers.map((performer, index) => {
                const initials = performer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                const colors = ['blue', 'green', 'yellow'];
                const color = colors[index] || 'gray';
                
                return (
                  <div key={performer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center`}>
                        <span className={`text-sm font-bold text-${color}-600`}>{initials}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{performer.name}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{performer.count} resolved</span>
                  </div>
                );
              })}
              {topPerformers.length === 0 && (
                <p className="text-sm text-gray-500">No performance data available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Recent Tickets Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Recent Tickets</h2>
            <p className="text-sm text-gray-500">A summary of the latest tickets created.</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length > 0 ? (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800">{ticket.title}</p>
                    <p className="text-sm text-gray-500">
                      Requested by {ticket.requester} • {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityPillColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-sm text-gray-500">
                No recent tickets to display.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;