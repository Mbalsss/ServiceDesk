// src/components/technician/EquipmentManagement.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import TechnicianHeader from "./TechnicianHeader";

interface Equipment {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: "active" | "inactive" | "maintenance" | "retired";
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

interface Technician {
  id: string;
  full_name: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-blue-100 text-blue-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  retired: "bg-gray-100 text-gray-800",
};

interface EquipmentManagementProps {
  currentUser: { id: string; name: string; email: string; role: string };
}

const EquipmentManagement: React.FC<EquipmentManagementProps> = ({ currentUser }) => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Equipment>>({});
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadTechnicians();
  }, []);

  // Fetch equipment
  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load Equipment Error:", error);
    } else {
      setEquipmentList(data ?? []);
    }
    setLoading(false);
  };

  // Fetch technicians
  const loadTechnicians = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "technician");

    if (error) {
      console.error("Load Technicians Error:", error);
    } else {
      setTechnicians(data ?? []);
    }
  };

  // Submit form (Add / Edit)
  const handleSubmit = async () => {
    if (!form.name) return alert("Equipment name is required");
    setSubmitting(true);

    const payload = {
      name: form.name,
      category: form.category,
      serial_number: form.serial_number,
      status: form.status ?? "active",
      assigned_to: form.assigned_to || null,
    };

    try {
      if (formMode === "create") {
        const { error } = await supabase.from("equipment").insert([payload]);
        if (error) throw error;
      } else if (formMode === "edit" && form.id) {
        const { error } = await supabase
          .from("equipment")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
      }

      await loadEquipment();
      setForm({});
      setFormMode("create");
      setModalOpen(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Open modal for add/edit
  const openModal = (mode: "create" | "edit", eq?: Equipment) => {
    setFormMode(mode);
    if (mode === "edit" && eq) {
      setForm(eq);
    } else {
      setForm({});
    }
    setModalOpen(true);
  };

  // Delete equipment
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) {
      alert(`Failed to delete equipment: ${error.message}`);
    } else {
      setEquipmentList(equipmentList.filter((eq) => eq.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <TechnicianHeader
        currentUser={currentUser}
        title="Equipment Management"
        subtitle="Manage all equipment and assignments"
      />

      {/* Page Container */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* White Container */}
        <div className="bg-white rounded-lg shadow-lg border p-6">
          {/* Add Equipment Button */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => openModal("create")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition"
            >
              Add Equipment
            </button>
          </div>

          {/* Loading / Empty State */}
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading equipment...</div>
          ) : equipmentList.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No equipment found.</div>
          ) : (
            /* Equipment Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipmentList.map((eq) => (
                <div
                  key={eq.id}
                  className="border rounded-lg p-5 bg-white shadow hover:shadow-lg transition relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-bold text-lg">{eq.name}</h2>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[eq.status]}`}
                    >
                      {eq.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Category: {eq.category}</p>
                  <p className="text-sm text-gray-500 mb-1">Serial: {eq.serial_number}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Assigned to:{" "}
                    {technicians.find((t) => t.id === eq.assigned_to)?.full_name || "Unassigned"}
                  </p>

                  <div className="flex gap-4 mt-3">
                    <button
                      onClick={() => openModal("edit", eq)}
                      className="text-green-600 hover:underline text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(eq.id)}
                      className="text-red-600 hover:underline text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold mb-4">
                {formMode === "create" ? "Add New Equipment" : "Edit Equipment"}
              </h2>

              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Equipment Name"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={form.category || ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="text"
                  placeholder="Serial Number"
                  value={form.serial_number || ""}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <select
                  value={form.status || "active"}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Equipment["status"] })
                  }
                  className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
                <select
                  value={form.assigned_to || ""}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="border rounded p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 mt-6 justify-end">
                <button
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-5 py-2 rounded-md transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md transition"
                >
                  {formMode === "create" ? "Add Equipment" : "Update Equipment"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentManagement;
