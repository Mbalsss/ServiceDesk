import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Report {
  id: string;
  description: string;
  report_date: string;
  status: string;
  image_url: string | null;
  created_at: string;
}

const FieldReport: React.FC = () => {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState('Pending');
  const [technicianName, setTechnicianName] = useState('');
  const [reports, setReports] = useState<Report[]>([]);

  // Fetch logged-in user info and previous reports
  useEffect(() => {
    const fetchUserAndReports = async () => {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert('You must be logged in.');
        return;
      }

      // Fetch full_name from profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      setTechnicianName(profileError ? 'Unknown Technician' : profileData.full_name);

      // Fetch previous reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('field_reports')
        .select('*')
        .eq('technician_id', user.id)
        .order('report_date', { ascending: false });

      if (!reportsError && reportsData) setReports(reportsData as Report[]);
    };

    fetchUserAndReports();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !date) {
      alert('Please fill in all required fields.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('User not logged in.');
      return;
    }

    let imageUrl: string | null = null;

    if (image) {
      // Sanitize filename
      const fileName = image.name.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
      const { data, error } = await supabase.storage
        .from('field-reports')
        .upload(`${Date.now()}_${fileName}`, image);

      if (error) {
        console.error(error);
        alert('Image upload failed.');
        return;
      }

      imageUrl = data.path;
    }

    // Insert field report using logged-in user's ID (ensures RLS passes)
    const { error } = await supabase.from('field_reports').insert([
      {
        technician_id: user.id,
        description,
        report_date: date,
        image_url: imageUrl,
        status
      }
    ]);

    if (error) {
      console.error(error);
      alert('Failed to submit report.');
      return;
    }

    alert(`Field report submitted for ${technicianName}!`);
    setDescription('');
    setDate('');
    setImage(null);
    setStatus('Pending');

    // Refresh reports
    const { data: reportsData } = await supabase
      .from('field_reports')
      .select('*')
      .eq('technician_id', user.id)
      .order('report_date', { ascending: false });

    if (reportsData) setReports(reportsData as Report[]);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Field Report</h2>
      <p className="mb-4 font-medium">Technician: {technicianName}</p>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Issue Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Describe what was checked or fixed..."
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Requires Follow-up">Requires Follow-up</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-1">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>

      <h3 className="text-xl font-semibold mt-8 mb-4">My Submitted Reports</h3>
      {reports.length === 0 ? (
        <p>No reports submitted yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Description</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Image</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{report.report_date}</td>
                  <td className="py-2 px-4 border-b">{report.description}</td>
                  <td className="py-2 px-4 border-b">{report.status}</td>
                  <td className="py-2 px-4 border-b">
                    {report.image_url ? (
                      <img
                        src={supabase.storage.from('field-reports').getPublicUrl(report.image_url).data.publicUrl}
                        alt="Report"
                        className="w-24 h-24 object-cover rounded"
                      />
                    ) : (
                      'No Image'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FieldReport;
