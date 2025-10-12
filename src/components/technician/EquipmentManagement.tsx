import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

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

interface FieldReport {
  id: string;
  technician_name: string;
  report_type: string;
  description: string;
  report_date: string;
  equipment: string;
  serial_number: string;
  work_hours: number;
  customer_name: string;
  site_location: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-blue-100 text-blue-800 border-blue-200",
  maintenance: "bg-yellow-100 text-yellow-800 border-yellow-200",
  retired: "bg-gray-100 text-gray-800 border-gray-200",
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Equipment details modal states
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentReports, setEquipmentReports] = useState<FieldReport[]>([]);
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);
  const [equipmentStats, setEquipmentStats] = useState({
    totalEquipment: 0,
    activeEquipment: 0,
    equipmentNeedingMaintenance: 0,
    mostServicedEquipment: [] as any[]
  });

  useEffect(() => {
    loadEquipment();
    loadTechnicians();
    fetchEquipmentStats();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("equipment")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error("Load Equipment Error:", error);
    else setEquipmentList(data ?? []);
    setLoading(false);
  };

  const loadTechnicians = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "technician");

    if (error) console.error("Load Technicians Error:", error);
    else setTechnicians(data ?? []);
  };

  const fetchEquipmentReports = async (equipmentId: string) => {
    const { data, error } = await supabase
      .from("field_reports")
      .select("*")
      .eq("equipment", equipmentId)
      .order("report_date", { ascending: false });
    
    if (!error && data) {
      setEquipmentReports(data);
    }
  };

  const fetchEquipmentStats = async () => {
    const { data: equipmentData } = await supabase.from('equipment').select('*');
    const { data: reportData } = await supabase.from('field_reports').select('*');
    
    if (equipmentData && reportData) {
      const stats = {
        totalEquipment: equipmentData.length,
        activeEquipment: equipmentData.filter(e => e.status === 'active').length,
        equipmentNeedingMaintenance: equipmentData.filter(e => e.status === 'maintenance').length,
        mostServicedEquipment: equipmentData.map(eq => ({
          ...eq,
          serviceCount: reportData.filter(r => r.equipment === eq.id).length
        })).sort((a, b) => b.serviceCount - a.serviceCount).slice(0, 5)
      };
      
      setEquipmentStats(stats);
    }
  };

  const viewEquipmentDetails = async (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    await fetchEquipmentReports(equipment.id);
    setShowEquipmentDetails(true);
  };

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
      await fetchEquipmentStats();
      setForm({});
      setFormMode("create");
      setModalOpen(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (mode: "create" | "edit", eq?: Equipment) => {
    setFormMode(mode);
    if (mode === "edit" && eq) setForm(eq);
    else setForm({});
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;
    const { error } = await supabase.from("equipment").delete().eq("id", id);
    if (error) alert(`Failed to delete equipment: ${error.message}`);
    else {
      setEquipmentList(equipmentList.filter((eq) => eq.id !== id));
      await fetchEquipmentStats();
    }
  };

  // Filter equipment based on search and status
  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || eq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const EquipmentCard = ({ eq, onViewDetails, onEdit, onDelete }: { 
    eq: Equipment; 
    onViewDetails: (eq: Equipment) => void; 
    onEdit: (eq: Equipment) => void; 
    onDelete: (id: string) => void; 
  }) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-all duration-200 group">
      {/* Header with Name and Status */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-sm truncate flex-1 pr-2" title={eq.name}>
          {eq.name}
        </h3>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColors[eq.status]} shrink-0`}
        >
          <span className="hidden sm:inline">
            {eq.status.charAt(0).toUpperCase() + eq.status.slice(1)}
          </span>
          <span className="sm:hidden">
            {eq.status.charAt(0).toUpperCase()}
          </span>
        </span>
      </div>

      {/* Equipment Details - Compact */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600 truncate">{eq.category}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600 font-mono truncate text-xs">#{eq.serial_number}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600 truncate">
            {technicians.find((t) => t.id === eq.assigned_to)?.full_name || "Unassigned"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onViewDetails(eq)}
          className="flex-1 bg-blue-50 hover:bg-blue-100 text-[#5483B3] py-2 px-2 rounded text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1 min-h-[2rem]"
        >
          <span className="xs:inline">Details</span>
        </button>
        <button
          onClick={() => onEdit(eq)}
          className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-2 rounded text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1 min-h-[2rem]"
        >
          <span className="xs:inline">Edit</span>
        </button>
        <button
          onClick={() => onDelete(eq.id)}
          className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 px-2 rounded text-xs font-medium transition-colors duration-200 flex items-center justify-center gap-1 min-h-[2rem]"
        >
          <span className="xs:inline">Delete</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Equipment Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage and track all company equipment and assignments
              </p>
            </div>
            <button
              onClick={() => openModal("create")}
              className="w-full sm:w-auto bg-[#5483B3] hover:bg-[#476a8a] text-white px-4 py-2.5 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <span>Add Equipment</span>
            </button>
          </div>
        </div>

        {/* Equipment Stats */}
        <div className="mb-4 sm:mb-6 overflow-x-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 min-w-max">
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-[140px]">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Equipment</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{equipmentStats.totalEquipment}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-[140px]">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Equipment</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{equipmentStats.activeEquipment}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-[140px]">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{equipmentStats.equipmentNeedingMaintenance}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 min-w-[140px]">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Most Serviced</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {equipmentStats.mostServicedEquipment[0]?.serviceCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="sm:hidden mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors duration-200"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Filters and Search Section */}
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4 ${showFilters ? 'block' : 'hidden sm:block'}`}>
          <div className="grid grid-cols-1 gap-3">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Equipment
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, serial, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-3 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5483B3]"></div>
              </div>
              <p className="mt-3 text-gray-500 text-sm">Loading equipment...</p>
            </div>
          ) : filteredEquipment.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <h3 className="mt-2 text-sm font-medium text-gray-900">No equipment found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {equipmentList.length === 0 
                  ? "Get started by adding your first piece of equipment."
                  : "No equipment matches your current filters."}
              </p>
              {equipmentList.length === 0 && (
                <button
                  onClick={() => openModal("create")}
                  className="mt-3 bg-[#5483B3] hover:bg-[#476a8a] text-white px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200"
                >
                  Add Equipment
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4">
              {filteredEquipment.map((eq) => (
                <EquipmentCard
                  key={eq.id}
                  eq={eq}
                  onViewDetails={viewEquipmentDetails}
                  onEdit={(eq) => openModal("edit", eq)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Equipment Count */}
        {!loading && equipmentList.length > 0 && (
          <div className="mt-3 text-sm text-gray-500 text-center">
            Showing {filteredEquipment.length} of {equipmentList.length} equipment
          </div>
        )}
      </div>

      {/* Add/Edit Equipment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {formMode === "create" ? "Add New Equipment" : "Edit Equipment"}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter equipment name"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Enter category"
                  value={form.category || ""}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="Enter serial number"
                  value={form.serial_number || ""}
                  onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={form.status || "active"}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as Equipment["status"] })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Technician
                </label>
                <select
                  value={form.assigned_to || ""}
                  onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                >
                  <option value="">Unassigned</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 sm:px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.name}
                className="px-3 sm:px-4 py-2 bg-[#5483B3] hover:bg-[#476a8a] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors duration-200 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    {formMode === "create" ? "Adding..." : "Updating..."}
                  </>
                ) : (
                  <>
                    {formMode === "create" ? "Add Equipment" : "Update Equipment"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Equipment Details Modal */}
      {showEquipmentDetails && selectedEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {selectedEquipment.name}
              </h2>
              <button 
                onClick={() => setShowEquipmentDetails(false)} 
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors duration-200"
              >
                <span className="text-lg font-bold">×</span>
              </button>
            </div>
            
            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
              {/* Equipment Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-900">{selectedEquipment.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="text-gray-900 font-mono text-sm">{selectedEquipment.serial_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[selectedEquipment.status]}`}>
                    {selectedEquipment.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="text-gray-900">
                    {technicians.find(t => t.id === selectedEquipment.assigned_to)?.full_name || 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Service History */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Service History</h3>
                {equipmentReports.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No service reports found for this equipment</p>
                ) : (
                  <div className="space-y-3">
                    {equipmentReports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{report.customer_name}</p>
                            <p className="text-xs text-gray-600 truncate">{report.site_location}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(report.report_date).toLocaleDateString()} • {report.report_type}
                            </p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize flex-shrink-0 ml-2">
                            {report.report_type}
                          </span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-700 mt-2 line-clamp-2">{report.description}</p>
                        )}
                        {report.work_hours && (
                          <p className="text-xs text-gray-500 mt-1">
                            Work hours: {report.work_hours}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;