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
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Ticket {
  id: number;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export default function Reports() {
  const [ticketData, setTicketData] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("all");

  // Fetch ticket data
  const fetchData = async () => {
    try {
      const res = await fetch("/api/tickets"); // Adjust API path
      const data = await res.json();
      setTicketData(data);
    } catch (error) {
      console.error("Error fetching ticket data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter tickets
  const filteredTickets =
    filter === "all" ? ticketData : ticketData.filter((t) => t.status === filter);

  // Status counts for charts
  const statusCounts = filteredTickets.reduce((acc: Record<string, number>, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  // Bar Chart Data
  const barData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "Tickets by Status",
        data: Object.values(statusCounts),
        backgroundColor: ["#4cafef", "#ff9800", "#4caf50", "#f44336"],
      },
    ],
  };

  // Pie Chart Data
  const pieData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "Tickets Distribution",
        data: Object.values(statusCounts),
        backgroundColor: ["#4cafef", "#ff9800", "#4caf50", "#f44336"],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Reports</h2>

      {/* Filter Dropdown */}
      <label>Filter by Status: </label>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="open">Open</option>
        <option value="in progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      {/* Refresh Button */}
      <button onClick={fetchData} style={{ marginLeft: "10px" }}>
        🔄 Refresh
      </button>

      {/* Bar Chart */}
      <div style={{ maxWidth: "600px", marginTop: "30px" }}>
        <h3>Tickets by Status (Bar)</h3>
        <Bar data={barData} />
      </div>

      {/* Pie Chart */}
      <div style={{ maxWidth: "600px", marginTop: "50px" }}>
        <h3>Tickets Distribution (Pie)</h3>
        <Pie data={pieData} />
      </div>
    </div>
  );
}
