import React, { useState } from 'react';
import { TechAvailability as TechType } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  technicians: TechType[];
  onTechniciansChange: (newTechs: TechType[]) => void;
}

const Agents: React.FC<Props> = ({ technicians, onTechniciansChange }) => {
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Technician');

  // Initialize default technicians if list is empty
  React.useEffect(() => {
    if (technicians.length === 0) {
      const defaultTechs: TechType[] = [
        { id: '1', name: 'Dumile Soga', status: 'available', role: 'Manager' },
        { id: '2', name: 'Rethabile Ntsekhe', status: 'available', role: 'Backend' },
        { id: '3', name: 'Petlo Matabane', status: 'available', role: 'Frontend' },
        { id: '4', name: 'Monica Ndlovu', status: 'available', role: 'Customer Support' },
      ];
      onTechniciansChange(defaultTechs);
    }
  }, [technicians, onTechniciansChange]);

  const addTechnician = () => {
    if (!newName) return;
    const newTech: TechType = { id: Date.now().toString(), name: newName, status: 'available', role: newRole };
    onTechniciansChange([...technicians, newTech]);
    setNewName('');
  };

  const removeTechnician = (id: string) => {
    onTechniciansChange(technicians.filter(t => t.id !== id));
  };

  const updateRole = (id: string, role: string) => {
    onTechniciansChange(technicians.map(t => t.id === id ? { ...t, role } : t));
  };

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
        />
        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="border rounded px-2 py-1">
          <option>Technician</option>
          <option>Manager</option>
          <option>Backend</option>
          <option>Frontend</option>
          <option>Customer Support</option>
          <option>Supervisor</option>
        </select>
        <button onClick={addTechnician} className="bg-blue-500 text-white px-4 rounded flex items-center space-x-1">
          <Plus className="w-4 h-4" /> <span>Add</span>
        </button>
      </div>

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
              >
                <option>Technician</option>
                <option>Manager</option>
                <option>Backend</option>
                <option>Frontend</option>
                <option>Customer Support</option>
                <option>Supervisor</option>
              </select>
              <button onClick={() => removeTechnician(tech.id)} className="text-red-500">
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
