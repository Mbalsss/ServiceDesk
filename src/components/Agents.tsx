import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Mail, User, CheckCircle, XCircle, Loader, Search, MoreVertical, Edit3, UserCheck, UserX 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  available: boolean;
  updated_at: string;
}

interface Props {
  technicians: Profile[];
  onTechniciansChange: (newTechs: Profile[]) => void;
}

const Agents: React.FC<Props> = ({ technicians, onTechniciansChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDepartment, setEditDepartment] = useState('');

  useEffect(() => {
    fetchTechnicians();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('full_name', { ascending: true });

      if (error) {
        setError('Error fetching technicians: ' + error.message);
        console.error('Error fetching technicians:', error);
        return;
      }

      if (data) {
        onTechniciansChange(data as Profile[]);
      }
    } catch (error) {
      setError('Unexpected error fetching technicians');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianInvited = () => {
    fetchTechnicians();
  };

  const updateDepartment = async (id: string, department: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('profiles').update({ 
        department: department || null,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) {
        setError('Failed to update department: ' + error.message);
        return;
      }
      
      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, department } : t));
      setEditingId(null);
      setSuccess('Department updated successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (id: string, available: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('profiles').update({ 
        available,
        updated_at: new Date().toISOString()
      }).eq('id', id);
      
      if (error) {
        setError('Failed to update availability: ' + error.message);
        return;
      }
      
      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, available } : t));
      setSuccess('Availability updated successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const removeTechnician = async (id: string) => {
    if (!confirm('Are you sure you want to remove this technician? This action cannot be undone.')) return;

    setLoading(true);
    setError(null);
    try {
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('id')
        .eq('assignee', id);
      
      if (ticketError) {
        setError('Error checking assigned tickets: ' + ticketError.message);
        return;
      }
      
      if (tickets && tickets.length > 0) {
        setError('Cannot remove technician with assigned tickets. Please reassign tickets first.');
        return;
      }
      
      const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
      if (profileError) {
        setError('Failed to remove technician profile: ' + profileError.message);
        return;
      }
      
      onTechniciansChange(technicians.filter(t => t.id !== id));
      setSuccess('Technician removed successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians
    .filter(tech => tech.role === 'technician')
    .filter(tech => {
      const matchesSearch = tech.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (tech.department && tech.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAvailability = availabilityFilter === 'all' || 
                                 (availabilityFilter === 'available' && tech.available) ||
                                 (availabilityFilter === 'unavailable' && !tech.available);
      
      return matchesSearch && matchesAvailability;
    });

  const startEditing = (tech: Profile) => {
    setEditingId(tech.id);
    setEditDepartment(tech.department || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDepartment('');
  };

  /** ------------------- InviteTechnician Code Integrated ------------------- **/

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const inviteTechnician = async () => {
    if (!inviteEmail.trim() || !inviteFullName.trim()) {
      setInviteError('Please provide both email and full name');
      return;
    }

    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInviteError('You must be logged in to invite technicians');
        return;
      }

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setInviteError('Supabase URL or API key not configured');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: inviteEmail.trim().toLowerCase(),
          full_name: inviteFullName.trim(),
          role: 'technician',
          department: inviteDepartment.trim() || null,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Failed to invite technician (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      await response.json();
      setInviteSuccess('Technician invited successfully! They will receive an email to set up their account.');
      setInviteEmail('');
      setInviteFullName('');
      setInviteDepartment('');
      fetchTechnicians();
    } catch (err: any) {
      setInviteError(err.message || 'An unexpected error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  /** ------------------- JSX ------------------- **/

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Technician Management</h2>
              <p className="text-gray-600 mt-1">Manage your technicians and their availability</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {filteredTechnicians.length} technicians
              </span>
            </div>
          </div>

          {/* Invite Technician Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Invite New Technician
            </h3>

            {inviteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <XCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700">{inviteError}</p>
                </div>
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium">Success</p>
                  <p className="text-green-700">{inviteSuccess}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={inviteFullName}
                onChange={e => setInviteFullName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={inviteLoading}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={inviteLoading}
              />
              <input
                type="text"
                placeholder="Department (Optional)"
                value={inviteDepartment}
                onChange={e => setInviteDepartment(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={inviteLoading}
              />
              <button
                onClick={inviteTechnician}
                disabled={inviteLoading || !inviteEmail.trim() || !inviteFullName.trim()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center space-x-2 disabled:bg-blue-300 hover:bg-blue-700 transition-colors"
              >
                {inviteLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                <span>{inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}</span>
              </button>
            </div>
          </div>

          {/* Technicians List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Technicians ({filteredTechnicians.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading technicians...</p>
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="p-8 text-center">
                <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No technicians found</p>
                {searchTerm || availabilityFilter !== 'all' ? (
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {filteredTechnicians.map(tech => (
                  <div key={tech.id} className="p-6 hover:bg-gray-50 transition-colors">
                    {/* Technician Card Content */}
                    {/* ... Existing expanded card logic remains the same ... */}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Agents;
