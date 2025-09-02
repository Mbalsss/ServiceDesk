import React, { useState } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { Ticket } from '../types';

interface CreateTicketProps {
  onTicketCreate: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const CreateTicket: React.FC<CreateTicketProps> = ({ onTicketCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'incident',
    priority: 'medium',
    category: '',
    subcategory: '',
    requester: '',
    email: '',
    assignee: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'> = {
      ...formData,
      status: 'open' as const,
      assignee: formData.assignee || 'Unassigned'
    };

    try {
      // 🔹 Send to backend
      const res = await fetch("http://localhost:5000/submit-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.requester,
          email: formData.email,
          issue: `${formData.title} - ${formData.description}`
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Ticket submitted! Notifications sent to Email + Teams.");
        onTicketCreate(newTicket); // update local state
        // Reset form
        setFormData({
          title: '',
          description: '',
          type: 'incident',
          priority: 'medium',
          category: '',
          subcategory: '',
          requester: '',
          email: '',
          assignee: ''
        });
      } else {
        alert("❌ Failed to submit ticket. Please try again.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("⚠️ Server error. Could not submit ticket.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Ticket</h2>
        <p className="text-gray-600">Submit a new incident or service request</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the issue or request"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="incident">Incident</option>
                  <option value="service_request">Service Request</option>
                </select>
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Network">Network</option>
                  <option value="Email">Email</option>
                  <option value="User Management">User Management</option>
                  <option value="Security">Security</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label htmlFor="requester" className="block text-sm font-medium text-gray-700 mb-1">
                  Requester *
                </label>
                <input
                  type="text"
                  id="requester"
                  name="requester"
                  value={formData.requester}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name of person requesting support"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Requester Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email of requester"
                />
              </div>

              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Auto-assign</option>
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Smith">Jane Smith</option>
                  <option value="Sarah Wilson">Sarah Wilson</option>
                </select>
              </div>

              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <input
                  type="text"
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Specific subcategory (optional)"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detailed description of the issue or request..."
            />
          </div>

          {/* Microsoft Teams Integration Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Microsoft Teams Integration</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Once created, this ticket will be sent to Microsoft Teams and email. 
                  The requester and technicians will receive notifications.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTicket;
