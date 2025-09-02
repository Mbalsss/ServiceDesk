import React, { useState } from "react";
import { Settings, Zap, UserPlus, Trash2 } from "lucide-react";

const ServiceDeskFeatures: React.FC = () => {
  // Mock data
  const [categories, setCategories] = useState(["Hardware", "Software", "Network"]);
  const [newCategory, setNewCategory] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [rules, setRules] = useState({
    autoAssign: true,
    autoClose: false,
    autoEscalate: true,
  });

  const [agents, setAgents] = useState([
    { id: 1, name: "Alice", role: "Admin", active: true },
    { id: 2, name: "Bob", role: "Agent", active: true },
  ]);
  const [newAgent, setNewAgent] = useState("");

  // Settings functions
  const addCategory = () => {
    if (newCategory.trim() !== "") {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };
  const removeCategory = (cat: string) => {
    setCategories(categories.filter(c => c !== cat));
  };

  // Agents functions
  const addAgent = () => {
    if (newAgent.trim() !== "") {
      setAgents([...agents, { id: Date.now(), name: newAgent, role: "Agent", active: true }]);
      setNewAgent("");
    }
  };
  const toggleAgentStatus = (id: number) => {
    setAgents(agents.map(a => (a.id === id ? { ...a, active: !a.active } : a)));
  };
  const updateAgentRole = (id: number, role: string) => {
    setAgents(agents.map(a => (a.id === id ? { ...a, role } : a)));
  };

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      {/* Settings */}
      <div className="p-4 border rounded-xl shadow">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Settings /> Settings</h2>
        
        <h3 className="mt-2 font-semibold">Ticket Categories</h3>
        <ul>
          {categories.map((c, i) => (
            <li key={i} className="flex justify-between p-1">
              {c}
              <button onClick={() => removeCategory(c)} className="text-red-500">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
        <input
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder="New category"
          className="border rounded p-1 mt-2 w-full"
        />
        <button onClick={addCategory} className="mt-2 p-1 bg-blue-500 text-white rounded w-full">
          + Add Category
        </button>

        <h3 className="mt-4 font-semibold">Notifications</h3>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={() => setNotificationsEnabled(!notificationsEnabled)}
          />
          Enable Email Notifications
        </label>
      </div>

      {/* Automation */}
      <div className="p-4 border rounded-xl shadow">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Zap /> Automation</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.autoAssign}
            onChange={() => setRules({ ...rules, autoAssign: !rules.autoAssign })}
          />
          Auto-assign tickets by category
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.autoClose}
            onChange={() => setRules({ ...rules, autoClose: !rules.autoClose })}
          />
          Auto-close inactive tickets
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={rules.autoEscalate}
            onChange={() => setRules({ ...rules, autoEscalate: !rules.autoEscalate })}
          />
          Auto-escalate urgent tickets
        </label>
      </div>

      {/* Agents */}
      <div className="p-4 border rounded-xl shadow col-span-2">
        <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus /> Agents</h2>
        <ul>
          {agents.map(a => (
            <li key={a.id} className="flex justify-between items-center border-b p-2">
              <span>{a.name} - {a.role} ({a.active ? "Active" : "Inactive"})</span>
              <div className="flex gap-2">
                <select
                  value={a.role}
                  onChange={e => updateAgentRole(a.id, e.target.value)}
                  className="border rounded p-1"
                >
                  <option>Agent</option>
                  <option>Admin</option>
                </select>
                <button
                  onClick={() => toggleAgentStatus(a.id)}
                  className={`px-2 py-1 rounded ${a.active ? "bg-red-500" : "bg-green-500"} text-white`}
                >
                  {a.active ? "Deactivate" : "Activate"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <input
          value={newAgent}
          onChange={e => setNewAgent(e.target.value)}
          placeholder="New agent name"
          className="border rounded p-1 mt-2 w-full"
        />
        <button onClick={addAgent} className="mt-2 p-1 bg-blue-500 text-white rounded w-full">
          + Add Agent
        </button>
      </div>
    </div>
  );
};

export default ServiceDeskFeatures;
