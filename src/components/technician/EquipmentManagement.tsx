import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

interface Equipment {
  id: string;
  name: string;
  category: string;
  serial_number: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
}

interface Technician {
  id: string;
  full_name: string;
}

const EquipmentManagement: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Partial<Equipment>>({});
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadEquipment();
    loadTechnicians();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    setEquipmentList(data ?? []);
    setLoading(false);
  };

  const loadTechnicians = async () => {
    const { data, error } = await supabase.from("profiles").select("id, full_name").eq("role", "technician");
    if (error) console.error(error);
    setTechnicians(data ?? []);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Equipment name is required");
      return;
    }
    setSubmitting(true);

    if (formMode === "create") {
      const { data, error } = await supabase.from("equipment").insert([form]);
      if (error) alert("Failed to add equipment");
      else setEquipmentList([...(data ?? []), ...equipmentList]);
    } else if (formMode === "edit" && form.id) {
      const { data, error } = await supabase.from("equipment").update(form).eq("id", form.id);
      if (error) alert("Failed to update equipment");
      else
        setEquipmentList(
          equipmentList.map((eq) => (eq.id === form.id ? { ...eq, ...form } as Equipment : eq))
        );
      setFormMode("create");
    }

    setForm({});
    setSubmitting(false);
  };

  const handleEdit = (eq: Equipment) => {
    setFormMode("edit");
    setForm(eq);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) alert("Failed to delete equipment");
    else setEquipmentList(equipmentList.filter((eq) => eq.id !== id));
  };

  if (loading) return <div className="p-4">Loading equipment...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Equipment Management</h1>

      {/* Form */}
      <div className="mb-8 p-4 bg-white shadow rounded-md border">
        <h2 className="text-xl font-semibold mb-3">{formMode === "create" ? "Add Equipment" : "Edit Equipment"}</h2>
        <input
          type="text"
          placeholder="Name"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Category"
          value={form.category || ""}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Serial Number"
          value={form.serial_number || ""}
          onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={form.status || "available"}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="available">Available</option>
          <option value="in_use">In Use</option>
          <option value="maintenance">Maintenance</option>
          <option value="retired">Retired</option>
        </select>
        <select
          value={form.assigned_to || ""}
          onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
          className="border rounded p-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Unassigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.full_name}
            </option>
          ))}
        </select>

        <div className="flex gap-2 mt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {formMode === "create" ? "Add Equipment" : "Update Equipment"}
          </button>
          {formMode === "edit" && (
            <button
              onClick={() => {
                setForm({});
                setFormMode("create");
              }}
              className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {equipmentList.map((eq) => (
          <div
            key={eq.id}
            className="border rounded-md p-4 bg-white shadow hover:shadow-lg transition relative"
          >
            <h2 className="font-semibold text-lg">{eq.name}</h2>
            <p className="text-sm text-gray-500 mb-1">Category: {eq.category}</p>
            <p className="text-sm text-gray-500 mb-1">Serial: {eq.serial_number}</p>
            <p className="text-sm text-gray-500 mb-1">Status: {eq.status}</p>
            <p className="text-sm text-gray-500 mb-2">
              Assigned to: {technicians.find((t) => t.id === eq.assigned_to)?.full_name || "Unassigned"}
            </p>

            <div className="flex gap-2">
              <button onClick={() => handleEdit(eq)} className="text-green-500 hover:underline text-sm">
                Edit
              </button>
              <button onClick={() => handleDelete(eq.id)} className="text-red-500 hover:underline text-sm">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EquipmentManagement;
