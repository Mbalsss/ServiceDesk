import React, { useState } from 'react';

interface FieldReportProps {
  technicianName?: string; // optional default
}

const technicianOptions = [
  'Monica Ndlovu',
  'Rethabile Ntsekhe',
  'Petlo Matabane',
  'Dumile Soga'
];

const FieldReport: React.FC<FieldReportProps> = ({ technicianName = 'Dumile Soga' }) => {
  const [selectedTech, setSelectedTech] = useState(technicianName);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ technician: selectedTech, description, date, image });
    alert(`Field report submitted for ${selectedTech}!`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Field Report</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4">
        <div>
          <label className="block font-medium mb-1">Technician Name</label>
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {technicianOptions.map((tech) => (
              <option key={tech} value={tech}>{tech}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1">Issue Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Upload Image</label>
          <input
            type="file"
            onChange={e => setImage(e.target.files ? e.target.files[0] : null)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default FieldReport;
