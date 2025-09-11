import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';



interface FieldReportProps {
  technicianName?: string;
}

interface Report {
  id: string;
  technician: string;
  report_type: string;
  description: string;
  date: string;
  equipment: string;
  serial_number: string;
  work_hours: number;
  parts_used: string;
  customer_name: string;
  customer_signature: string;
  image_url: string;
  created_at: string;
}

const technicianOptions = [
  'Monica Ndlovu',
  'Rethabile Ntsekhe',
  'Petlo Matabane',
  'Dumile Soga'
];

const reportTypeOptions = [
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'installation', label: 'Installation' },
  { id: 'repair', label: 'Repair' }
];

const equipmentOptions = [
  'Network Router',
  'Switch',
  'Server',
  'Workstation',
  'Printer',
  'Security Camera',
  'Access Control System',
  'Telephone System'
];

const FieldReport: React.FC<FieldReportProps> = ({ technicianName = 'Dumile Soga' }) => {
  const [selectedTech, setSelectedTech] = useState(technicianName);
  const [reportType, setReportType] = useState('maintenance');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState<File | null>(null);
  const [equipment, setEquipment] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [workHours, setWorkHours] = useState('');
  const [partsUsed, setPartsUsed] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerSignature, setCustomerSignature] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing reports on component mount
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('field_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        setError(`Error fetching reports: ${error.message}`);
        return;
      }
      
      setReports(data || []);
      setError(null);
    } catch (err: any) {
      setError(`Error fetching reports: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!customerName || !description || !date) {
        throw new Error('Customer name, description, and date are required');
      }

      // Upload image if selected
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('field-report-images')
          .upload(fileName, image);
        
        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('field-report-images')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }
      
      // Insert report data
      const { data, error: insertError } = await supabase
        .from('field_reports')
        .insert([
          {
            technician: selectedTech,
            report_type: reportType,
            description,
            date,
            equipment,
            serial_number: serialNumber,
            work_hours: workHours ? parseFloat(workHours) : null,
            parts_used: partsUsed,
            customer_name: customerName,
            customer_signature: customerSignature,
            image_url: imageUrl
          }
        ])
        .select();
      
      if (insertError) {
        throw new Error(`Database error: ${insertError.message}`);
      }
      
      console.log('Report submitted successfully:', data);
      setIsSubmitted(true);
      
      // Refresh reports list
      await fetchReports();
      
      // Reset form after successful submission
      setTimeout(() => {
        setIsSubmitted(false);
        setDescription('');
        setEquipment('');
        setSerialNumber('');
        setWorkHours('');
        setPartsUsed('');
        setCustomerName('');
        setCustomerSignature('');
        setImage(null);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureDraw = () => {
    const signature = prompt("Please enter customer name for signature verification:");
    if (signature) {
      setCustomerSignature(signature);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Field Service Report</h2>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          {isSubmitted && (
            <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-4">
              Report submitted successfully!
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Report Type Selection */}
            <div>
              <label className="block font-medium mb-2">Report Type</label>
              <div className="flex gap-4">
                {reportTypeOptions.map((type) => (
                  <label key={type.id} className="flex items-center">
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={(e) => setReportType(e.target.value)}
                      className="mr-2"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>
            
            {/* Technician and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Technician Name</label>
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                >
                  {technicianOptions.map((tech) => (
                    <option key={tech} value={tech}>{tech}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            </div>
            
            {/* Customer Information */}
            <div>
              <label className="block font-medium mb-1">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border p-2 rounded"
                placeholder="Enter customer name"
                required
              />
            </div>
            
            {/* Equipment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Equipment Type</label>
                <select
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select equipment</option>
                  {equipmentOptions.map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="Equipment serial number"
                />
              </div>
            </div>
            
            {/* Work Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Work Hours</label>
                <input
                  type="number"
                  value={workHours}
                  onChange={e => setWorkHours(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="Hours spent"
                  min="0"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block font-medium mb-1">Parts Used</label>
                <input
                  type="text"
                  value={partsUsed}
                  onChange={e => setPartsUsed(e.target.value)}
                  className="w-full border p-2 rounded"
                  placeholder="List parts used"
                />
              </div>
            </div>
            
            {/* Description */}
            <div>
              <label className="block font-medium mb-1">
                {reportType === 'maintenance' ? 'Maintenance Details' : 
                 reportType === 'installation' ? 'Installation Details' : 'Issue Description'}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border p-2 rounded"
                rows={4}
                placeholder={
                  reportType === 'maintenance' ? 'Describe maintenance performed...' : 
                  reportType === 'installation' ? 'Describe installation process...' : 
                  'Describe the issue and resolution...'
                }
                required
              />
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="block font-medium mb-1">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setImage(e.target.files ? e.target.files[0] : null)}
                className="w-full"
              />
              {image && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected: {image.name}
                </div>
              )}
            </div>
            
            {/* Customer Signature */}
            <div>
              <label className="block font-medium mb-1">Customer Signature</label>
              <button
                type="button"
                onClick={handleSignatureDraw}
                className="bg-gray-200 px-4 py-2 rounded mr-2"
              >
                {customerSignature ? 'Update Signature' : 'Add Signature'}
              </button>
              {customerSignature && (
                <span className="text-sm text-green-600 ml-2">✓ Signature recorded</span>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 font-medium disabled:bg-blue-400 w-full"
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </form>
        </div>
        
        {/* Reports List Section */}
        <div className="bg-white rounded-lg p-6 shadow-md border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Recent Reports</h3>
          
          {reports.length === 0 ? (
            <p className="text-gray-500">No reports submitted yet.</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="border-b pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{report.customer_name}</h4>
                      <p className="text-sm text-gray-600">{report.technician} • {new Date(report.date).toLocaleDateString()}</p>
                      <p className="text-sm capitalize">{report.report_type}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                      {report.report_type}
                    </span>
                  </div>
                  <p className="text-sm mt-2 line-clamp-2">{report.description}</p>
                  {report.image_url && (
                    <div className="mt-2 text-xs text-blue-600">
                      📷 Image attached
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldReport;