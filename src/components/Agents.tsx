import React, { useState, useEffect } from 'react';
import { TechAvailability as TechType } from '../types';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Your Supabase client

interface Props {
  technicians: TechType[];
  onTechniciansChange: (newTechs: TechType[]) => void;
}

const Agents: React.FC<Props> = ({ technicians, onTechniciansChange }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Technician');
  const [loading, setLoading] = useState(false);

  // Fetch technicians from Supabase on component mount
  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching technicians:', error);
        return;
      }

      if (data && data.length > 0) {
        onTechniciansChange(data as TechType[]);
      } else {
        // Initialize with default technicians if table is empty
        await initializeDefaultTechnicians();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultTechnicians = async () => {
    const defaultTechs: Omit<TechType, 'id'>[] = [
      { name: 'Dumile Soga', status: 'available', role: 'Manager' },
      { name: 'Rethabile Ntsekhe', status: 'available', role: 'Backend' },
      { name: 'Petlo Matabane', status: 'available', role: 'Frontend' },
      { name: 'Monica Ndlovu', status: 'available', role: 'Customer Support' },
    ];

    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert(defaultTechs)
        .select();

      if (error) {
        console.error('Error inserting default technicians:', error);
        return;
      }

      if (data) {
        onTechniciansChange(data as TechType[]);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const addTechnician = async () => {
    if (!newName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('technicians')
        .insert([{ name: newName.trim(), role: newRole }])
        .select()
        .single();

      if (error) {
        console.error('Error adding technician:', error);
        return;
      }

      if (data) {
        onTechniciansChange([...technicians, data as TechType]);
        setNewName('');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTechnician = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('technicians')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting technician:', error);
        return;
      }

      onTechniciansChange(technicians.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('technicians')
        .update({ role })
        .eq('id', id);

      if (error) {
        console.error('Error updating role:', error);
        return;
      }

      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, role } : t));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && technicians.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Agent Management</h2>

      {/* Add Technician */}
      <div className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="Technician Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          disabled={loading}
        />
        <select 
          value={newRole} 
          onChange={(e) => setNewRole(e.target.value)} 
          className="border rounded px-2 py-1"
          disabled={loading}
        >
          <option>Technician</option>
          <option>Manager</option>
          <option>Backend</option>
          <option>Frontend</option>
          <option>Customer Support</option>
          <option>Supervisor</option>
        </select>
        <button 
          onClick={addTechnician} 
          disabled={loading || !newName.trim()}
          className="bg-blue-500 text-white px-4 rounded flex items-center space-x-1 disabled:bg-blue-300"
        >
          <Plus className="w-4 h-4" /> <span>Add</span>
        </button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Technicians Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="flex justify-between items-center border-b last:border-b-0 py-2">
            <div>
              <span className="font-medium">{tech.name}</span> - <span className="text-gray-500">{tech.role}</span>
            </div>
            <div className="flex space-x-2">
              <select
                value={tech.role}
                onChange={(e) => updateRole(tech.id, e.target.value)}
                className="border rounded px-2 py-1"
                disabled={loading}
              >
                <option>Technician</option>
                <option>Manager</option>
                <option>Backend</option>
                <option>Frontend</option>
                <option>Customer Support</option>
                <option>Supervisor</option>
              </select>
              <button 
                onClick={() => removeTechnician(tech.id)} 
                disabled={loading}
                className="text-red-500 disabled:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Agents;