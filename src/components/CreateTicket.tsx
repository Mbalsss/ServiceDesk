import React, { useState, useEffect, useRef } from 'react';
import { Save, ChevronDown, ChevronUp } from 'lucide-react';
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
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-500"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                value === option.value ? 'bg-blue-100 text-blue-800' : 'text-gray-900'
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
    estimated_time: '',
  });
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Calculate SLA deadline based on priority
  const calculateSLADeadline = (priority: string): string => {
    const now = new Date();
    switch (priority) {
      case 'critical':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(); // 4 hours
      case 'high':
        return new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours
      case 'medium':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
      case 'low':
        return new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString(); // 72 hours
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
  };

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
      const slaDeadline = calculateSLADeadline(formData.priority);

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
          sla_deadline: slaDeadline,
          estimated_time: formData.estimated_time || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Ticket created successfully:', data);

      // Reset form and notify parent
      setFormData({
        title: '',
        description: '',
        type: '',
        priority: '',
        category: '',
        assignee_id: '',
        estimated_time: '',
      });
      removeImage();
      onTicketCreate();
    } catch (err) {
      console.error('Error creating ticket:', err);
      alert('An error occurred while creating the ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-xl font-semibold text-gray-800">Create New Ticket</h2>
            <p className="text-sm text-gray-500 mt-1">Submit a new incident or service request.</p>
          </div>

          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
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
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                  <CustomDropdown
                    options={priorityOptions}
                    value={formData.priority}
                    onChange={(value) => handleDropdownChange('priority', value)}
                    placeholder="Select priority"
                    className="mt-1"
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requester</label>
                  <input
                    type="text"
                    value={currentUser.name}
                    readOnly
                    className="w-full p-2 border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                  <input
                    type="text"
                    name="estimated_time"
                    value={formData.estimated_time}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 2 hours"
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
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Provide a detailed description of the issue..."
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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