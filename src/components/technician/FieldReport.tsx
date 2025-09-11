import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Layout from './Layout';

interface FieldReportProps {
  technicianName?: string;
  currentUser: { id: string; name: string; email: string; role: string };
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
  site_location: string;
  sla_type: string;
  spares_used: string;
  spares_left: string;
  installation_details: string;
  ticket_id: string;
  ticket_number: string;
}

const reportTypeOptions = [
  { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
  { id: 'installation', label: 'Installation', icon: '🛠️' },
  { id: 'repair', label: 'Repair', icon: '🔍' }
];

const equipmentOptions = [
  'Network Router',
  'Switch',
  'Server',
  'Workstation',
  'Printer',
  'Security Camera',
  'Access Control System',
  'Telephone System',
  'LED Screen System',
  'Digital Signage'
];

const slaOptions = [
  'Standard',
  'Premium',
  'Enterprise',
  'On-Demand'
];

const FieldReport: React.FC<FieldReportProps> = ({ technicianName, currentUser }) => {
  // Use the current user's name as the technician
  const [selectedTech] = useState(currentUser.name);
  const [reportType, setReportType] = useState('installation');
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
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [siteLocation, setSiteLocation] = useState('');
  const [slaType, setSlaType] = useState('');
  const [sparesUsed, setSparesUsed] = useState('');
  const [sparesLeft, setSparesLeft] = useState('');
  const [installationDetails, setInstallationDetails] = useState('');
  const [activeTab, setActiveTab] = useState('form');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [availableTickets, setAvailableTickets] = useState<any[]>([]);

  // Fetch existing reports and available tickets on component mount
  useEffect(() => {
    fetchReports();
    fetchAvailableTickets();
  }, []);

  const fetchAvailableTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, ticket_number, status')
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setAvailableTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('field_reports')
        .select(`
          *,
          ticket:tickets(ticket_number, title, status)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        setError(`Error fetching reports: ${error.message}`);
        return;
      }
      
      // Transform data to include ticket info
      const transformedData = data.map((report: any) => ({
        ...report,
        ticket_number: report.ticket?.ticket_number,
        ticket_title: report.ticket?.title
      }));
      
      setReports(transformedData || []);
      setError(null);
    } catch (err: any) {
      setError(`Error fetching reports: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Validate required fields
    if (!customerName) {
      setError('Customer name is required');
      setIsLoading(false);
      return;
    }
    
    if (!siteLocation) {
      setError('Site location is required');
      setIsLoading(false);
      return;
    }
    
    if (reportType === 'installation' && !installationDetails) {
      setError('Installation details are required');
      setIsLoading(false);
      return;
    }
    
    try {
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
      
      // Get ticket number if ticket is selected
      const selectedTicketData = availableTickets.find(t => t.id === selectedTicket);
      
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
            image_url: imageUrl,
            site_location: siteLocation,
            sla_type: slaType,
            spares_used: sparesUsed,
            spares_left: sparesLeft,
            installation_details: installationDetails,
            ticket_id: selectedTicket || null,
            ticket_number: selectedTicketData?.ticket_number || null
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
        setSiteLocation('');
        setSlaType('');
        setSparesUsed('');
        setSparesLeft('');
        setInstallationDetails('');
        setSelectedTicket('');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setCustomerSignature(canvas.toDataURL());
    setShowSignaturePad(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const applyInstallationTemplate = () => {
    setInstallationDetails('Installation of 1600x2560 screen\n\nIssues encountered:\n• \n• \n\nSpares used: 4 x P1.16\n\nSpares left on site: Eyean');
  };

  return (
    <Layout 
      currentUser={currentUser}
      title="Field Service Report"
      subtitle="Complete and submit detailed service reports for client documentation"
    >
      <div className="max-w-6xl mx-auto">
        {/* Main Content Container */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 border-b border-red-100 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'form' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('form')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                New Report
              </span>
            </button>
            <button
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('reports')}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Recent Reports
              </span>
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'form' ? (
              <div>
                {isSubmitted && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Report submitted successfully!
                  </div>
                )}
                
                {/* Ticket Linking Section */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                  <label className="block text-sm font-medium mb-2 text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                    </svg>
                    Link to Service Ticket (Optional)
                  </label>
                  <select
                    value={selectedTicket}
                    onChange={(e) => setSelectedTicket(e.target.value)}
                    className="w-full border border-blue-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm bg-white"
                  >
                    <option value="">Select a service ticket to link</option>
                    {availableTickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        #{ticket.ticket_number} - {ticket.title} ({ticket.status})
                      </option>
                    ))}
                  </select>
                  {selectedTicket && (
                    <p className="text-xs text-blue-600 mt-2 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      This field report will be linked to the selected service ticket
                    </p>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Report Type Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-700">Report Type</label>
                        <div className="flex gap-3">
                          {reportTypeOptions.map((type) => (
                            <button
                              type="button"
                              key={type.id}
                              onClick={() => setReportType(type.id)}
                              className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg text-sm font-medium transition-all ${
                                reportType === type.id 
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300 shadow-sm' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200'
                              }`}
                            >
                              <span className="text-xl mb-1">{type.icon}</span>
                              <span>{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Site and Date */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Site Location *</label>
                          <input
                            type="text"
                            value={siteLocation}
                            onChange={e => setSiteLocation(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="Enter site location"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Date *</label>
                          <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Customer Information */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Client Name *</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                          placeholder="Enter client name"
                          required
                        />
                      </div>
                      
                      {/* SLA Type */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">SLA Type</label>
                        <select
                          value={slaType}
                          onChange={(e) => setSlaType(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm bg-white"
                        >
                          <option value="">Select SLA type</option>
                          {slaOptions.map((sla) => (
                            <option key={sla} value={sla}>{sla}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Equipment Information */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Equipment Type</label>
                          <select
                            value={equipment}
                            onChange={(e) => setEquipment(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm bg-white"
                          >
                            <option value="">Select equipment</option>
                            {equipmentOptions.map((eq) => (
                              <option key={eq} value={eq}>{eq}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Serial Number</label>
                          <input
                            type="text"
                            value={serialNumber}
                            onChange={e => setSerialNumber(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="Equipment serial number"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Installation Details */}
                      {reportType === 'installation' && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Installation Details *</label>
                            <button
                              type="button"
                              onClick={applyInstallationTemplate}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              Apply Template
                            </button>
                          </div>
                          <textarea
                            value={installationDetails}
                            onChange={e => setInstallationDetails(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            rows={4}
                            placeholder="Describe installation process, issues encountered, etc."
                            required={reportType === 'installation'}
                          />
                        </div>
                      )}
                      
                      {/* Work Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Work Hours</label>
                          <input
                            type="number"
                            value={workHours}
                            onChange={e => setWorkHours(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="Hours"
                            min="0"
                            step="0.5"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Parts Used</label>
                          <input
                            type="text"
                            value={partsUsed}
                            onChange={e => setPartsUsed(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="List parts used"
                          />
                        </div>
                      </div>
                      
                      {/* Spares Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Spares Used</label>
                          <input
                            type="text"
                            value={sparesUsed}
                            onChange={e => setSparesUsed(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="e.g., 4 x P1.16"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Spares Left</label>
                          <input
                            type="text"
                            value={sparesLeft}
                            onChange={e => setSparesLeft(e.target.value)}
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                            placeholder="e.g., Eyean"
                          />
                        </div>
                      </div>
                      
                      {/* General Description */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          {reportType === 'maintenance' ? 'Maintenance Details' : 
                          reportType === 'repair' ? 'Issue Description' : 'Additional Notes'}
                        </label>
                        <textarea
                          value={description}
                          onChange={e => setDescription(e.target.value)}
                          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
                          rows={3}
                          placeholder={
                            reportType === 'maintenance' ? 'Describe maintenance performed...' : 
                            reportType === 'repair' ? 'Describe the issue and resolution...' : 
                            'Any additional notes...'
                          }
                        />
                      </div>
                      
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">Upload Image</label>
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors p-4">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-8 h-8 mb-2 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                              </svg>
                              <p className="text-sm text-gray-500 text-center">
                                {image ? (
                                  <span className="font-medium text-blue-600">{image.name}</span>
                                ) : (
                                  <span className="font-medium">Click to upload or drag and drop</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF (MAX. 5MB)</p>
                            </div>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => setImage(e.target.files ? e.target.files[0] : null)} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                      
                      {/* Signatures */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Technician *</label>
                          <div className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 text-sm text-gray-700 flex items-center">
                            <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {selectedTech}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z" clipRule="evenodd" />
                            </svg>
                            Signed in as: {currentUser.email}
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700">Client Signature</label>
                          <button
                            type="button"
                            onClick={() => setShowSignaturePad(true)}
                            className={`w-full border-2 p-3 rounded-lg text-left flex items-center justify-between text-sm ${
                              customerSignature 
                                ? 'border-green-500 bg-green-50 text-green-700' 
                                : 'border-gray-300 hover:bg-gray-50'
                            } transition-colors`}
                          >
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                              {customerSignature ? 'Signature recorded' : 'Click to add signature'}
                            </span>
                            {customerSignature ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {showSignaturePad && (
                    <div className="mt-6 p-5 border rounded-xl bg-white shadow-lg">
                      <p className="text-sm mb-4 font-medium text-gray-700 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        Please draw your signature below:
                      </p>
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={200}
                        className="border rounded-lg mb-4 w-full bg-white"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                      />
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={saveSignature}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Save Signature
                        </button>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSignaturePad(false)}
                          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <div className="pt-6 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Recent Reports
                </h3>
                
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm">No reports submitted yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {reports.map((report) => (
                      <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        {/* Ticket Link Badge */}
                        {report.ticket_id && (
                          <div className="flex items-center mb-3">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                              </svg>
                              Linked to Ticket #{report.ticket_number}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{report.customer_name}</h4>
                            <p className="text-xs text-gray-600 truncate">{report.site_location}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString()}</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-xs capitalize px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                {report.report_type}
                              </span>
                            </div>
                          </div>
                          {report.image_url && (
                            <div className="ml-2 flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-700 mt-3 line-clamp-2">
                          {report.installation_details || report.description || 'No description provided'}
                        </p>
                        {report.work_hours && (
                          <div className="flex items-center mt-3 text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {report.work_hours} hours
                          </div>
                        )}
                        
                        {/* View in Service Desk Button */}
                        {report.ticket_id && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <button
                              onClick={() => window.open(`/tickets/${report.ticket_id}`, '_blank')}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              View in Service Desk
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FieldReport;