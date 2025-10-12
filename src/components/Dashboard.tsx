import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  // Props if needed
}

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  onHoldTickets: number;
  closedTickets: number;
  criticalTickets: number;
  totalUsers: number;
  totalEquipment: number;
  maintenanceDue: number;
  slaCompliance: number;
  escalatedTickets: number;
  avgResolutionTime: string;
  reopenedTickets: number;
}

interface TicketType {
  id: string;
  title: string;
  requester: string;
  priority: string;
  status: string;
  created_at: string;
}

interface TicketTrend {
  day: string;
  date: string;
  tickets: number;
}

interface TopPerformer {
  id: string;
  name: string;
  count: number;
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    onHoldTickets: 0,
    closedTickets: 0,
    criticalTickets: 0,
    totalUsers: 0,
    totalEquipment: 0,
    maintenanceDue: 0,
    slaCompliance: 0,
    escalatedTickets: 0,
    avgResolutionTime: '0h',
    reopenedTickets: 0
  });
  
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [ticketTrends, setTicketTrends] = useState<TicketTrend[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
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

      setStats({
        totalTickets: ticketsData.total,
        openTickets: ticketsData.open,
        inProgressTickets: ticketsData.inProgress,
        onHoldTickets: ticketsData.onHold,
        closedTickets: ticketsData.closed,
        reopenedTickets: ticketsData.reopened,
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
      // Get all tickets and count locally - this avoids the 400 errors
      const { data: allTickets, error: allError, count: totalCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact' });
      
      if (allError) throw allError;
      
      // Count tickets by status using the actual status values from your database
      const openTickets = allTickets?.filter(ticket => 
        ticket.status === 'open'
      ) || [];
      
      const inProgressTickets = allTickets?.filter(ticket => 
        ticket.status === 'in_progress'
      ) || [];
      
      const onHoldTickets = allTickets?.filter(ticket => 
        ticket.status === 'on_hold'
      ) || [];
      
      const closedTickets = allTickets?.filter(ticket => 
        ticket.status === 'closed'
      ) || [];
      
      const reopenedTickets = allTickets?.filter(ticket => 
        ticket.status === 'reopened'
      ) || [];
      
      const criticalTickets = allTickets?.filter(ticket => 
        ticket.priority === 'critical'
      ) || [];

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
        total: totalCount || 0,
        open: openTickets.length,
        inProgress: inProgressTickets.length,
        onHold: onHoldTickets.length,
        closed: closedTickets.length,
        reopened: reopenedTickets.length,
        critical: criticalTickets.length,
        recent: formattedRecentTickets
      };
      
    } catch (error) {
      console.error('Error fetching tickets data:', error);
      return {
        total: 0,
        open: 0,
        inProgress: 0,
        onHold: 0,
        closed: 0,
        reopened: 0,
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
      const { count: total, error: totalError } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true });
      
      if (totalError) throw totalError;
      return { total: total || 0 };
    } catch (error) {
      console.error('Error fetching equipment data:', error);
      return { total: 0 };
    }
  };

  const fetchMaintenanceData = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, next_maintenance_date, status')
        .lte('next_maintenance_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .neq('status', 'retired');
      
      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      return 0;
    }
  };

  const fetchTicketTrends = async (): Promise<TicketTrend[]> => {
    try {
      // Calculate date range for last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6); // 7 days including today
      
      // Format dates for Supabase query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('tickets')
        .select('created_at')
        .gte('created_at', `${startDateStr}T00:00:00.000Z`)
        .lte('created_at', `${endDateStr}T23:59:59.999Z`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Initialize daily counts for the last 7 days
      const dailyCounts: { [key: string]: number } = {};
      const dateLabels: string[] = [];
      
      // Create array for last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        dailyCounts[dateKey] = 0;
        dateLabels.push(label);
      }

      // Count tickets per day
      data?.forEach(ticket => {
        const ticketDate = new Date(ticket.created_at).toISOString().split('T')[0];
        if (dailyCounts[ticketDate] !== undefined) {
          dailyCounts[ticketDate]++;
        }
      });

      // Convert to array format with proper dates
      const result = Object.entries(dailyCounts).map(([dateKey], index) => ({
        day: dateLabels[index],
        date: dateKey,
        tickets: dailyCounts[dateKey]
      }));

      return result;
    } catch (error) {
      console.error('Error in fetchTicketTrends:', error);
      // Return default empty data for last 7 days
      const defaultData: TicketTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        defaultData.push({ 
          day: label, 
          date: date.toISOString().split('T')[0],
          tickets: 0 
        });
      }
      return defaultData;
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('category')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;

      const categoryCounts: { [key: string]: number } = {};
      data?.forEach(ticket => {
        categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1;
      });

      const colorMap: { [key: string]: string } = {
        software: 'bg-[#5483B3]',
        hardware: 'bg-[#7BA4D0]',
        network: 'bg-[#5AB8A8]',
        access: 'bg-[#D0857B]',
        other: 'bg-[#3A5C80]'
      };

      const result = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({
          category,
          count,
          color: colorMap[category] || 'bg-[#3A5C80]'
        }));

      return result;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      return [];
    }
  };

  const fetchTopPerformers = async (): Promise<TopPerformer[]> => {
    try {
      // Get ticket data with assignee information
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, assignee_id, closed_at')
        .eq('status', 'closed')
        .not('assignee_id', 'is', null)
        .not('closed_at', 'is', null)
        .gte('closed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (ticketsError) {
        console.error('Error fetching ticket data:', ticketsError);
        return [];
      }
      
      if (!ticketsData || ticketsData.length === 0) {
        return [];
      }
      
      // Count closed tickets per technician
      const technicianCounts: { [key: string]: number } = {};
      const technicianIds: string[] = [];
      
      ticketsData.forEach(ticket => {
        if (ticket.assignee_id && ticket.closed_at) {
          const techId = ticket.assignee_id;
          technicianCounts[techId] = (technicianCounts[techId] || 0) + 1;
          if (!technicianIds.includes(techId)) {
            technicianIds.push(techId);
          }
        }
      });
      
      if (technicianIds.length === 0) {
        return [];
      }
      
      // Get technician names
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', technicianIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Return with placeholder names if profile fetch fails
        return Object.entries(technicianCounts)
          .map(([id, count]) => ({ 
            id, 
            name: `Technician ${id.substring(0, 8)}`,
            count 
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
      
      // Combine the data
      const performers = technicianIds.map(technicianId => {
        const profile = profilesData?.find(p => p.id === technicianId);
        return {
          id: technicianId,
          name: profile?.full_name || `Technician ${technicianId.substring(0, 8)}`,
          count: technicianCounts[technicianId] || 0
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
      
      return performers;
      
    } catch (error) {
      console.error('Error in fetchTopPerformers:', error);
      return [];
    }
  };

  const fetchSlaData = async () => {
    try {
      // Calculate SLA compliance for closed tickets only
      const { data: closedTickets, error } = await supabase
        .from('tickets')
        .select('created_at, closed_at, sla_deadline, priority')
        .not('sla_deadline', 'is', null)
        .eq('status', 'closed')
        .not('closed_at', 'is', null);
      
      if (error) {
        console.error('Error fetching SLA data:', error);
        return {
          compliance: 0,
          avgResolution: '0h',
          escalated: 0
        };
      }

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

  // Calculate max tickets for chart scaling
  const maxTickets = Math.max(...ticketTrends.map(trend => trend.tickets), 1);
  
  // Overview cards without icons
  const overviewCards = [
    { title: 'Total Tickets', value: stats.totalTickets },
    { title: 'Open Tickets', value: stats.openTickets },
    { title: 'In Progress', value: stats.inProgressTickets },
    { title: 'On Hold', value: stats.onHoldTickets },
    { title: 'Closed Tickets', value: stats.closedTickets },
    { title: 'Critical Issues', value: stats.criticalTickets }
  ];

  // System metrics without icons
  const systemMetrics = [
    { title: 'Total Users', value: stats.totalUsers },
    { title: 'Total Equipment', value: stats.totalEquipment },
    { title: 'Maintenance Due', value: stats.maintenanceDue }
  ];

  // Performance metrics without icons
  const performanceMetrics = [
    { title: 'SLA Compliance', value: `${stats.slaCompliance}%` },
    { title: 'Escalated Tickets', value: stats.escalatedTickets },
    { title: 'Avg. Resolution Time', value: stats.avgResolutionTime },
    { title: 'Reopened Tickets', value: stats.reopenedTickets }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5483B3] mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Comprehensive overview of service desk performance and metrics
            </p>
          </div>
        </div>

        {/* Overview Cards Section - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4">
          {overviewCards.map(card => (
            <div key={card.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 lg:p-4 transition-all hover:shadow-md">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{card.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 truncate">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* System Metrics Section - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {systemMetrics.map(metric => (
            <div key={metric.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6 transition-all hover:shadow-md">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-500 truncate">{metric.title}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 truncate">{metric.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance & Trends Section - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Ticket Trends Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Ticket Trends (Last 7 Days)</h2>
            </div>
            <div className="h-48 sm:h-56 lg:h-64">
              <div className="h-full flex items-end space-x-1 sm:space-x-2 justify-between">
                {ticketTrends.map((item, index) => {
                  const heightPercentage = (item.tickets / maxTickets) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className="w-full bg-gradient-to-t from-[#5483B3] to-[#7BA4D0] rounded-t-md hover:from-[#3A5C80] hover:to-[#5483B3] transition-all duration-200 min-h-2"
                        style={{ height: `${Math.max(8, heightPercentage)}%` }}
                        title={`${item.tickets} tickets on ${item.day}`}
                      >
                        {item.tickets > 0 && (
                          <div className="text-white text-xs font-bold text-center mt-1">
                            {item.tickets}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 mt-2 text-center leading-tight">
                        {item.day.split(',')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Performance Metrics</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {performanceMetrics.map(metric => (
                <div key={metric.title} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-500 truncate">{metric.title}</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-800 truncate">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Focus Areas Section - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Top Issue Categories */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Top Issue Categories (Last 30 Days)</h2>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-gray-700 capitalize truncate">{item.category}</span>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{item.count} tickets</span>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-sm text-gray-500 p-2">No category data available</p>
              )}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">Top Performers (Last 30 Days)</h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => {
                  const initials = performer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
                  const rankColors = [
                    'bg-gradient-to-br from-yellow-400 to-yellow-500', // Gold
                    'bg-gradient-to-br from-gray-400 to-gray-500',     // Silver
                    'bg-gradient-to-br from-amber-600 to-amber-700',   // Bronze
                    'bg-gradient-to-br from-[#5483B3] to-[#7BA4D0]',  // Brand Blue
                    'bg-gradient-to-br from-[#5AB8A8] to-[#7BD0C5]'   // Brand Teal
                  ];
                  const color = rankColors[index] || 'bg-gradient-to-br from-[#3A5C80] to-[#5483B3]';
                  
                  return (
                    <div key={performer.id} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${color} text-white font-bold`}>
                            <span className="text-xs sm:text-sm font-bold">{initials}</span>
                          </div>
                          {index < 3 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#5483B3] rounded-full flex items-center justify-center border-2 border-white">
                              <span className="text-xs font-bold text-white">{index + 1}</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-700 truncate block">{performer.name}</span>
                          <div className="flex items-center gap-1 sm:gap-2 mt-0.5">
                            <span className="text-xs text-gray-500 truncate">{performer.count} closed</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-sm font-bold text-[#5483B3]">{performer.count}</span>
                        <div className="text-xs text-gray-400">tickets</div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 sm:py-8">
                  <p className="text-sm text-gray-500">No performance data available</p>
                  <p className="text-xs text-gray-400 mt-1">Closed tickets from last 30 days will appear here</p>
                </div>
              )}
            </div>
            
            {/* Performance Summary */}
            {topPerformers.length > 0 && (
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Closures:</span>
                  <span className="font-semibold text-[#5483B3]">
                    {topPerformers.reduce((sum, performer) => sum + performer.count, 0)} tickets
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1 sm:mt-2">
                  <span className="text-gray-500">Top Performer:</span>
                  <span className="font-semibold text-[#5483B3] truncate ml-2">
                    {topPerformers[0]?.name} ({topPerformers[0]?.count})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Tickets Section - Mobile Optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-800">Recent Tickets</h2>
            <p className="text-sm text-gray-500">A summary of the latest tickets created.</p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length > 0 ? (
              recentTickets.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">{ticket.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      Requested by {ticket.requester} • {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${getPriorityPillColor(ticket.priority)} whitespace-nowrap`}>
                      {ticket.priority}
                    </span>
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