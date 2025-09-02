import React, { useState } from 'react';
import { TechAvailability as TechType } from '../types';

interface Props {
  onStatusUpdate: () => void;
}

const initialTechnicians: TechType[] = [
  { id: '1', name: 'Monica Ndlovu', status: 'available', workload: 0 },
  { id: '2', name: 'Rethabile Ntsekhe', status: 'available', workload: 0 },
  { id: '3', name: 'Petlo Matabane', status: 'available', workload: 0 },
  { id: '4', name: 'Dumile Soga', status: 'available', workload: 0 },
];

const TechAvailability: React.FC<Props> = ({ onStatusUpdate }) => {
  const [technicians, setTechnicians] = useState<TechType[]>(initialTechnicians);

  const handleStatusChange = (id: string, status: TechType['status']) => {
    setTechnicians(technicians.map(t => t.id === id ? { ...t, status } : t));
  };

  const saveStatus = (id: string, status: TechType['status']) => {
    // Here you can call your service if needed
    onStatusUpdate();
  };

  const getStatusColor = (status: TechType['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Technician Availability</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {technicians.map((tech) => (
          <div key={tech.id} className="flex justify-between items-center border-b last:border-b-0 py-2">
            <span className="font-medium">{tech.name}</span>
            <div className="flex items-center space-x-2">
              <select
                value={tech.status}
                onChange={(e) => handleStatusChange(tech.id, e.target.value as TechType['status'])}
                className={`border rounded px-2 py-1 ${getStatusColor(tech.status)} text-white`}
              >
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </select>
              <button
                onClick={() => saveStatus(tech.id, tech.status)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TechAvailability;
