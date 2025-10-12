import React, { useState, useEffect, useRef } from 'react';
import { Save, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Technician = {
  id: string;
  full_name: string;
};

interface CreateTicketProps {
  currentUser: { id: string; name: string; email: string; role: string };
  currentUserRole?: string;
  onTicketCreate: () => void;
  onCancel: () => void;
}

// Custom dropdown component
interface CustomDropdownProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] flex items-center justify-between bg-white transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2.5 cursor-pointer hover:bg-[#5483B3] hover:text-white text-sm transition-colors duration-200 ${
                value === option.value ? 'bg-[#5483B3] text-white' : 'text-gray-900'
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateTicket: React.FC<CreateTicketProps> = ({
  currentUser,
  currentUserRole,
  onTicketCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '' as 'incident' | 'service_request' | 'problem' | 'change' | '',
    priority: '' as 'low' | 'medium' | 'high' | 'critical' | '',
    category: '' as 'software' | 'hardware' | 'network' | 'access' | 'other' | '',
    assignee_id: '',
  });
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);
  const [slaDeadline, setSlaDeadline] = useState<string | null>(null);

  // Calculate SLA deadline based on priority
  const calculateSLADeadline = (priority: string): { deadline: string; displayText: string } => {
    const now = new Date();
    let deadline: Date;
    let displayText: string;

    switch (priority) {
      case 'critical':
        deadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
        displayText = '2 hours';
        break;
      case 'high':
        deadline = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
        displayText = '4 hours';
        break;
      case 'medium':
        deadline = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        displayText = '6 hours';
        break;
      case 'low':
        deadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours
        displayText = '8 hours';
        break;
      default:
        deadline = new Date(now.getTime() + 8 * 60 * 60 * 1000); // 8 hours default
        displayText = '8 hours';
    }

    return {
      deadline: deadline.toISOString(),
      displayText: displayText
    };
  };

  // Format date for display
  const formatSLADisplay = (deadline: string): string => {
    return new Date(deadline).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get SLA info for current priority
  const getCurrentSLAInfo = () => {
    if (!formData.priority) return null;
    return calculateSLADeadline(formData.priority);
  };

  const slaInfo = getCurrentSLAInfo();

  // Dropdown options
  const typeOptions = [
    { value: 'incident', label: 'Incident' },
    { value: 'service_request', label: 'Service Request' },
    { value: 'problem', label: 'Problem' },
    { value: 'change', label: 'Change' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  const categoryOptions = [
    { value: 'software', label: 'Software' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'network', label: 'Network' },
    { value: 'access', label: 'Access' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch technicians if current user is admin
  useEffect(() => {
    if (currentUserRole === 'admin') {
      const fetchTechnicians = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['technician', 'admin']);
        if (!error) setTechnicians(data || []);
      };
      fetchTechnicians();
    }
  }, [currentUserRole]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSuccessClose = () => {
    setShowSuccessMessage(false);
    setCreatedTicketNumber(null);
    setSlaDeadline(null);
    onTicketCreate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.type || !formData.priority) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    let imageUrl: string | null = null;

    try {
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('ticket-images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('ticket-images')
          .getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      // Calculate SLA deadline based on priority
      const slaDeadlineInfo = calculateSLADeadline(formData.priority);

      // Insert ticket and get the response with the generated ticket_number
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          priority: formData.priority,
          category: formData.category,
          assignee_id: currentUserRole === 'admin' ? (formData.assignee_id || null) : null,
          image_url: imageUrl,
          status: 'open',
          requester_id: currentUser.id,
          sla_deadline: slaDeadlineInfo.deadline,
        })
        .select('ticket_number')
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Ticket created successfully:', data);

      // Show success message
      setCreatedTicketNumber(data.ticket_number);
      setSlaDeadline(slaDeadlineInfo.deadline);
      setShowSuccessMessage(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: '',
        priority: '',
        category: '',
        assignee_id: '',
      });
      removeImage();

    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('An error occurred while creating the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (showSuccessMessage) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
        onClick={handleSuccessClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 sm:p-6 text-center relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleSuccessClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Ticket Created Successfully!</h3>
          <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
            Ticket <span className="font-bold text-[#5483B3]">#{createdTicketNumber}</span> has been created and is now in the queue.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
            <div className="flex items-center justify-center gap-2 text-[#5483B3] mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">SLA Deadline</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-[#476a8a]">
              {slaDeadline && formatSLADisplay(slaDeadline)}
            </p>
            <p className="text-xs text-[#5483B3] mt-1">
              Please ensure resolution before this time
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-gray-600">
              You can view this ticket in the "My Tickets" section.
            </p>
          </div>

          <button
            onClick={handleSuccessClose}
            className="w-full px-4 py-2.5 bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] transition-colors font-medium text-sm sm:text-base"
          >
            Close & Return
          </button>
          
          <p className="text-xs text-gray-500 mt-2 sm:mt-3">
            The ticket has been saved to the system
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Create New Ticket</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">Submit a new incident or service request.</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                    placeholder="e.g., Cannot connect to VPN"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <CustomDropdown
                    options={typeOptions}
                    value={formData.type}
                    onChange={(value) => handleDropdownChange('type', value)}
                    placeholder="Select type"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <CustomDropdown
                    options={priorityOptions}
                    value={formData.priority}
                    onChange={(value) => handleDropdownChange('priority', value)}
                    placeholder="Select priority"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <CustomDropdown
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(value) => handleDropdownChange('category', value)}
                    placeholder="Select category"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed text-sm"
                  />
                </div>

                {currentUserRole === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
                    <CustomDropdown
                      options={[
                        { value: '', label: 'Unassigned' },
                        ...technicians.map(tech => ({ value: tech.id, label: tech.full_name }))
                      ]}
                      value={formData.assignee_id}
                      onChange={(value) => handleDropdownChange('assignee_id', value)}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#5483B3] file:text-white hover:file:bg-[#476a8a] transition-colors duration-200"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SLA Information */}
            {formData.priority && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#5483B3]" />
                  <span className="text-sm font-semibold text-[#5483B3]">SLA Information</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <div>
                    <span className="text-[#5483B3]">Priority Level: </span>
                    <span className="font-medium capitalize text-[#476a8a]">{formData.priority}</span>
                  </div>
                  <div>
                    <span className="text-[#5483B3]">Response Time: </span>
                    <span className="font-medium text-[#476a8a]">{slaInfo?.displayText}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[#5483B3]">Deadline: </span>
                    <span className="font-medium text-[#476a8a]">
                      {slaInfo && formatSLADisplay(slaInfo.deadline)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-colors duration-200"
                placeholder="Provide a detailed description of the issue..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors duration-200 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium bg-[#5483B3] text-white rounded-lg hover:bg-[#476a8a] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 order-1 sm:order-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;