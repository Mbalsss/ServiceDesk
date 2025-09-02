import { useState, useEffect } from "react";
import { technicianService } from "../services/technicianService"; // Make sure CRUD methods exist

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState("");
  const [newAgent, setNewAgent] = useState({ name: "", role: "", status: "Available" });
  const [editingAgent, setEditingAgent] = useState(null);

  // Load agents
  useEffect(() => {
    async function fetchAgents() {
      try {
        const allAgents = await technicianService.getAllTechnicians();
        setAgents(allAgents);
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    }
    fetchAgents();
  }, []);

  // Add new agent
  const handleAddAgent = async () => {
    try {
      const created = await technicianService.addTechnician(newAgent);
      if (created) {
        setAgents([...agents, created]);
        setNewAgent({ name: "", role: "", status: "Available" });
      }
    } catch (error) {
      console.error("Error adding agent:", error);
    }
  };

  // Delete agent
  const handleDeleteAgent = async (id) => {
    try {
      const success = await technicianService.deleteTechnician(id);
      if (success) {
        setAgents(prev => prev.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  // Update agent status only
  const handleStatusChange = async (agentId, status) => {
    try {
      const success = await technicianService.updateTechnicianStatus(agentId, status);
      if (success) {
        setAgents(prev =>
          prev.map(a => (a.id === agentId ? { ...a, status } : a))
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Edit agent profile
  const handleEditAgent = async () => {
    try {
      const updated = await technicianService.updateTechnician(editingAgent.id, editingAgent);
      if (updated) {
        setAgents(prev =>
          prev.map(a => (a.id === editingAgent.id ? updated : a))
        );
        setEditingAgent(null);
      }
    } catch (error) {
      console.error("Error editing agent:", error);
    }
  };

  // Filtered agents
  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>👥 Manage Support Team Roster</h1>

      {/* Search */}
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          placeholder="Search agents..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: "8px",
            width: "250px",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      {/* Add Agent */}
      <div style={{ marginBottom: "20px" }}>
        <h3>Add New Technician</h3>
        <input
          type="text"
          placeholder="Name"
          value={newAgent.name}
          onChange={e => setNewAgent({ ...newAgent, name: e.target.value })}
          style={{ padding: "6px", marginRight: "10px" }}
        />
        <input
          type="text"
          placeholder="Role"
          value={newAgent.role}
          onChange={e => setNewAgent({ ...newAgent, role: e.target.value })}
          style={{ padding: "6px", marginRight: "10px" }}
        />
        <select
          value={newAgent.status}
          onChange={e => setNewAgent({ ...newAgent, status: e.target.value })}
          style={{ padding: "6px", marginRight: "10px" }}
        >
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
          <option value="Offline">Offline</option>
        </select>
        <button onClick={handleAddAgent} style={{ padding: "6px 12px" }}>
          ➕ Add
        </button>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f3f3f3" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>ID</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Role</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Status</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredAgents.map(agent => (
            <tr key={agent.id}>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>{agent.id}</td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {editingAgent?.id === agent.id ? (
                  <input
                    type="text"
                    value={editingAgent.name}
                    onChange={e =>
                      setEditingAgent({ ...editingAgent, name: e.target.value })
                    }
                  />
                ) : (
                  agent.name
                )}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {editingAgent?.id === agent.id ? (
                  <input
                    type="text"
                    value={editingAgent.role}
                    onChange={e =>
                      setEditingAgent({ ...editingAgent, role: e.target.value })
                    }
                  />
                ) : (
                  agent.role
                )}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {editingAgent?.id === agent.id ? (
                  <select
                    value={editingAgent.status}
                    onChange={e =>
                      setEditingAgent({ ...editingAgent, status: e.target.value })
                    }
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                ) : (
                  <select
                    value={agent.status}
                    onChange={e => handleStatusChange(agent.id, e.target.value)}
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Offline">Offline</option>
                  </select>
                )}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px" }}>
                {editingAgent?.id === agent.id ? (
                  <>
                    <button onClick={handleEditAgent}>💾 Save</button>
                    <button onClick={() => setEditingAgent(null)}>❌ Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingAgent(agent)}>✏️ Edit</button>
                    <button onClick={() => handleDeleteAgent(agent.id)}>🗑️ Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
