import React, { useState } from "react";

interface FieldReportProps {
  technicianName: string;
}

interface ReportEntry {
  id: number;
  technician: string;
  description: string;
  date: string;
  imageUrl: string;
}

const FieldReport: React.FC<FieldReportProps> = ({ technicianName }) => {
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reports, setReports] = useState<ReportEntry[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !imageFile) return alert("Please add description and image.");

    const newReport: ReportEntry = {
      id: reports.length + 1,
      technician: technicianName,
      description,
      date: new Date().toLocaleString(),
      imageUrl: URL.createObjectURL(imageFile)
    };

    setReports([newReport, ...reports]);
    setDescription("");
    setImageFile(null);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Field Report</h2>

      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
        <div className="mb-4">
          <label className="block font-medium mb-1">Technician:</label>
          <input
            type="text"
            value={technicianName}
            disabled
            className="w-full border border-gray-300 rounded p-2 bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
            className="w-full border border-gray-300 rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Upload Image:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Submit Report
        </button>
      </form>

      <div>
        <h3 className="text-xl font-semibold mb-2">Submitted Reports</h3>
        {reports.length === 0 ? (
          <p className="text-gray-500">No reports submitted yet.</p>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="border border-gray-200 p-4 rounded bg-white shadow">
                <p className="text-sm text-gray-500 mb-1">Technician: {r.technician}</p>
                <p className="text-sm text-gray-500 mb-1">Date: {r.date}</p>
                <p className="mb-2">{r.description}</p>
                <img src={r.imageUrl} alt="Uploaded" className="max-w-full rounded" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FieldReport;
