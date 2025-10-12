import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import { supabase } from "../lib/supabase";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

interface Ticket {
  id: string;
  created_at: string;
  updated_at: string | null;
  ticket_number: string;
  title: string | null;
  description: string | null;
  type: string;
  priority: string;
  status: string;
  category: string;
  requester_id: string | null;
  assignee_id: string | null;
  image_url: string | null;
  sla_deadline: string | null;
  estimated_time: string | null;
  closed_by: string | null;
  closed_at: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  department: string | null;
}

interface AgentPerformance {
  id: string;
  name: string;
  ticketsHandled: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  iconBgColor: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, iconBgColor, iconColor }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
    <div className="flex items-center justify-between">
      <h3 className="text-xs sm:text-sm font-medium text-gray-600">{title}</h3>
      <div className={`p-1.5 sm:p-2 ${iconBgColor} rounded-lg`}>
        <div className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColor} rounded`}></div>
      </div>
    </div>
    <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{description}</p>
  </div>
);

export default function Reports() {
  const [ticketData, setTicketData] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [dateRange, setDateRange] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from Supabase
  const fetchData = async () => {
    setIsLoading(true);
    try {
      let ticketsQuery = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      // Only apply date filter if not "all"
      if (dateRange !== "all") {
        const now = new Date();
        const daysAgo = new Date(now.setDate(now.getDate() - parseInt(dateRange)));
        ticketsQuery = ticketsQuery.gte('created_at', daysAgo.toISOString());
      }

      // Fetch tickets from Supabase
      const { data: ticketsData, error: ticketsError } = await ticketsQuery;

      if (ticketsError) {
        console.error("Error fetching ticket data:", ticketsError);
        return;
      }

      // Fetch profiles from Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department');

      if (profilesError) {
        console.error("Error fetching profiles data:", profilesError);
        return;
      }

      setTicketData(ticketsData || []);
      setProfiles(profilesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Get agent name by ID
  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "Unassigned";
    
    const profile = profiles.find(p => p.id === agentId);
    return profile?.full_name || `User (${agentId.slice(0, 8)}...)`;
  };

  // Filter tickets by date range if needed
  const filteredTickets = dateRange === "all" 
    ? ticketData 
    : ticketData.filter(ticket => {
        const ticketDate = new Date(ticket.created_at);
        const now = new Date();
        const daysAgo = new Date(now.setDate(now.getDate() - parseInt(dateRange)));
        return ticketDate >= daysAgo;
      });

  // Calculate metrics
  const calculateMetrics = () => {
    // Status counts for charts
    const statusCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    // Priority counts
    const priorityCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    // Category counts
    const categoryCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});

    // Calculate resolution time for resolved/closed tickets
    const resolvedTickets = filteredTickets.filter(t => t.closed_at);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.closed_at!);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedTickets.length
      : 0;

    // Calculate SLA compliance
    const ticketsWithSla = filteredTickets.filter(t => t.sla_deadline && t.closed_at);
    const slaCompliantTickets = ticketsWithSla.filter(t => {
      const resolved = new Date(t.closed_at!);
      const deadline = new Date(t.sla_deadline!);
      return resolved <= deadline;
    });
    const slaComplianceRate = ticketsWithSla.length > 0 
      ? (slaCompliantTickets.length / ticketsWithSla.length) * 100 
      : 0;

    // Calculate agent performance
    const agentPerformance: AgentPerformance[] = [];
    const agents = Array.from(new Set(filteredTickets.map(t => t.assignee_id).filter(id => id !== null)));
    
    agents.forEach(agentId => {
      const agentTickets = filteredTickets.filter(t => t.assignee_id === agentId);
      const resolvedAgentTickets = agentTickets.filter(t => t.closed_at);
      
      let avgResolutionTime = 0;
      if (resolvedAgentTickets.length > 0) {
        avgResolutionTime = resolvedAgentTickets.reduce((sum, t) => {
          const created = new Date(t.created_at);
          const resolved = new Date(t.closed_at!);
          return sum + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / resolvedAgentTickets.length;
      }
      
      const agentTicketsWithSla = agentTickets.filter(t => t.sla_deadline && t.closed_at);
      const slaCompliantAgentTickets = agentTicketsWithSla.filter(t => {
        const resolved = new Date(t.closed_at!);
        const deadline = new Date(t.sla_deadline!);
        return resolved <= deadline;
      });
      
      const slaComplianceRate = agentTicketsWithSla.length > 0 
        ? (slaCompliantAgentTickets.length / agentTicketsWithSla.length) * 100 
        : 0;
      
      agentPerformance.push({
        id: agentId || 'unassigned',
        name: getAgentName(agentId),
        ticketsHandled: agentTickets.length,
        avgResolutionTime,
        slaComplianceRate
      });
    });

    // Sort agents by tickets handled (descending)
    agentPerformance.sort((a, b) => b.ticketsHandled - a.ticketsHandled);

    return {
      statusCounts,
      priorityCounts,
      categoryCounts,
      avgResolutionTime,
      slaComplianceRate,
      agentPerformance,
    };
  };

  const metrics = calculateMetrics();

  // Format status labels for display
  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get color for status
  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      'open': '#5483B3',         // Brand Blue
      'in_progress': '#7BA4D0',  // Light Blue
      'resolved': '#5AB8A8',     // Teal
      'closed': '#3A5C80',       // Dark Blue
      'on_hold': '#D0857B',      // Red
      'reopened': '#607d8b',     // Gray
    };
    return statusColors[status] || '#607d8b'; // Default to gray
  };

  // Get color for priority
  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      'low': '#5AB8A8',     // Teal
      'medium': '#7BA4D0',  // Light Blue
      'high': '#D0857B',    // Red
      'critical': '#3A5C80', // Dark Blue
    };
    return priorityColors[priority] || '#607d8b'; // Default to gray
  };

  // Get color for category
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      'software': '#5483B3',     // Brand Blue
      'hardware': '#7BA4D0',     // Light Blue
      'network': '#5AB8A8',      // Teal
      'access': '#D0857B',       // Red
      'other': '#3A5C80',        // Dark Blue
    };
    return categoryColors[category] || '#607d8b'; // Default to gray
  };

  // Chart Data
  const chartData = {
    bar: {
      labels: Object.keys(metrics.statusCounts).map(formatStatusLabel),
      datasets: [
        {
          label: "Tickets by Status",
          data: Object.values(metrics.statusCounts),
          backgroundColor: Object.keys(metrics.statusCounts).map(status => getStatusColor(status)),
          borderRadius: 4,
        },
      ],
    },
    priority: {
      labels: Object.keys(metrics.priorityCounts).map(priority => 
        priority.charAt(0).toUpperCase() + priority.slice(1)
      ),
      datasets: [
        {
          data: Object.values(metrics.priorityCounts),
          backgroundColor: Object.keys(metrics.priorityCounts).map(priority => getPriorityColor(priority)),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    },
    category: {
      labels: Object.keys(metrics.categoryCounts).map(category => 
        category.charAt(0).toUpperCase() + category.slice(1)
      ),
      datasets: [
        {
          label: "Tickets",
          data: Object.values(metrics.categoryCounts),
          backgroundColor: Object.keys(metrics.categoryCounts).map(category => getCategoryColor(category)),
          borderRadius: 4,
        },
      ],
    },
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Date Filter in Right Corner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 text-sm sm:text-base">Track and analyze support ticket metrics</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded mr-2"></div>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="border-0 bg-transparent focus:outline-none focus:ring-0 text-xs sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 days</option>
                <option value="14">Last 14 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            <button className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50 text-xs sm:text-sm">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-600 rounded"></div>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-48 sm:h-64">
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#5483B3]"></div>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <MetricCard
                  title="Total Tickets"
                  value={filteredTickets.length}
                  description={`Tickets in ${dateRange === "all" ? "all time" : `last ${dateRange} days`}`}
                  iconBgColor="bg-[#F0F5FC]"
                  iconColor="bg-[#5483B3]"
                />
                <MetricCard
                  title="Avg. Resolution Time"
                  value={`${metrics.avgResolutionTime.toFixed(1)}`}
                  description="Days to resolve"
                  iconBgColor="bg-green-50"
                  iconColor="bg-[#5AB8A8]"
                />
                <MetricCard
                  title="SLA Compliance"
                  value={`${metrics.slaComplianceRate.toFixed(1)}%`}
                  description="Meeting deadlines"
                  iconBgColor="bg-[#F0F5FC]"
                  iconColor="bg-[#5483B3]"
                />
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600">In Progress</h3>
                  <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {filteredTickets.filter(t => t.status === 'in_progress').length}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600">Resolved</h3>
                  <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {filteredTickets.filter(t => t.status === 'resolved').length}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-600">Closed</h3>
                  <p className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">
                    {filteredTickets.filter(t => t.status === 'closed').length}
                  </p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                {/* Status Chart - Bar Chart */}
                <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tickets by Status</h3>
                  <div className="h-48 sm:h-64 lg:h-80">
                    <Bar data={chartData.bar} options={chartOptions} />
                  </div>
                </div>

                {/* Priority Chart - Pie Chart */}
                <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tickets by Priority</h3>
                  <div className="h-48 sm:h-64">
                    <Pie data={chartData.priority} options={chartOptions} />
                  </div>
                </div>

                {/* Category Chart - Bar Chart */}
                <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:col-span-2">
                  <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Tickets by Category</h3>
                  <div className="h-48 sm:h-64">
                    <Bar data={chartData.category} options={chartOptions} />
                  </div>
                </div>
              </div>

              {/* Agent Performance */}
              <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#5483B3] rounded mr-2"></div>
                  Agent Performance
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Handled</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Resolution Time</th>
                        <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SLA Compliance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {metrics.agentPerformance.map((agent) => (
                        <tr key={agent.id}>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">{agent.name}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">{agent.ticketsHandled}</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">{agent.avgResolutionTime.toFixed(1)} days</td>
                          <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-sm">{agent.slaComplianceRate.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}