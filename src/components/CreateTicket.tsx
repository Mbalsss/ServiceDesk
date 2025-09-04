import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Ticket } from '../types';

type Technician = {
  id: string;
  full_name: string;
};

interface CreateTicketProps {
  currentUser: { id: string; name: string; email: string; role: string };
  currentUserRole?: string;
  onTicketCreate: (ticket: {
    title: string;
    description: string;
    type: 'incident' | 'service_request' | 'problem' | 'change';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'software' | 'hardware' | 'network' | 'access' | 'other';
    assignee_id?: string | null;
    image_url?: string | null;
    status: 'open' | 'in_progress' | 'on_hold' | 'resolved' | 'closed' | 'reopened';
    requester: string;
  }) => void;
  onCancel: () => void;
}

const CreateTicket: React.FC<CreateTicketProps> = ({
  currentUser,
  currentUserRole,
  onTicketCreate,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'incident' as 'incident' | 'service_request' | 'problem' | 'change',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    category: 'software' as 'software' | 'hardware' | 'network' | 'access' | 'other',
    assignee_id: '',
  });
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      alert('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    let imageUrl: string | null = null;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('ticket-images').upload(fileName, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('ticket-images').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }

      onTicketCreate({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        priority: formData.priority,
        category: formData.category.toLowerCase() as any, // ensure lowercase
        assignee_id: currentUserRole === 'admin' ? (formData.assignee_id || null) : null,
        image_url: imageUrl,
        status: 'open',
        requester: currentUser.id
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Create New Ticket</h2>
          <p className="text-sm text-gray-500 mt-1">Submit a new incident or service request.</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Cannot connect to VPN" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select name="type" value={formData.type} onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="incident">Incident</option>
                  <option value="service_request">Service Request</option>
                  <option value="problem">Problem</option>
                  <option value="change">Change</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority *</label>
                <select name="priority" value={formData.priority} onChange={handleChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange} required
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="software">Software</option>
                  <option value="hardware">Hardware</option>
                  <option value="network">Network</option>
                  <option value="access">Access</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Requester</label>
                <input type="text" value={currentUser.name} readOnly
                  className="mt-1 w-full p-2 border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm" />
              </div>

              {currentUserRole === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assignee</label>
                  <select name="assignee_id" value={formData.assignee_id} onChange={handleChange}
                    className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Unassigned</option>
                    {technicians.map(tech => (
                      <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Upload Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleImageChange}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm" />
                {imagePreview && (
                  <div className="mt-2">
                    <img src={imagePreview} alt="Preview"
                      className="w-32 h-32 object-cover rounded-md border border-gray-300" />
                    <button type="button" onClick={removeImage} className="mt-2 text-sm text-red-600 hover:text-red-800">
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description *</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required
              rows={4}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Provide a detailed description of the issue..." />
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
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
  );
};

export default CreateTicket;
