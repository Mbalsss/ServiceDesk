import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Mail, User, CheckCircle, XCircle } from 'lucide-react';
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
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('technician');
  const [newDepartment, setNewDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['technician', 'admin'])
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

  const inviteTechnician = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      setError('Please provide both name and email');
      return;
    }

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newEmail.trim())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        setError('Error checking existing user: ' + checkError.message);
        console.error('Error checking existing user:', checkError);
        return;
      }

      if (existingUser) {
        setError('A technician with this email already exists');
        return;
      }

      // IMPORTANT: Make sure you have proper Supabase permissions set up
      // You need to enable "Enable email invitations" in your Supabase Auth settings
      // and ensure your RLS policies allow user creation

      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(newEmail.trim(), {
        data: { 
          full_name: newName.trim(),
          role: newRole,
          department: newDepartment,
        }
      });

      if (inviteError) {
        if (inviteError.message.includes('not allowed')) {
          setError('Invitation permissions not enabled. Please check Supabase Auth settings.');
        } else if (inviteError.message.includes('already registered')) {
          setError('User with this email already exists');
        } else {
          setError('Failed to send invitation: ' + inviteError.message);
        }
        console.error('Error sending invitation:', inviteError);
        return;
      }

      // Create the profile manually since the user hasn't signed up yet
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: 'temp-' + Date.now(), // Temporary ID, will be updated when user signs up
          full_name: newName.trim(),
          email: newEmail.trim(),
          role: newRole,
          department: newDepartment,
          available: true,
          updated_at: new Date().toISOString()
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Continue anyway since the invitation was sent
      }

      setSuccess('Invitation sent successfully! The technician will appear here once they complete registration.');
      
      setNewName('');
      setNewEmail('');
      setNewDepartment('');
      
      // Refresh the list
      fetchTechnicians();
      
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setInviting(false);
    }
  };

  const resendInvitation = async (tech: Profile) => {
    if (!tech.email) {
      setError('No email address found for this technician');
      return;
    }

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(tech.email, {
        data: { 
          full_name: tech.full_name,
          role: tech.role,
          department: tech.department
        }
      });

      if (error) {
        setError('Failed to resend invitation: ' + error.message);
        console.error('Error resending invitation:', error);
        return;
      }

      setSuccess('Invitation resent successfully!');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (id: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id);

      if (error) {
        setError('Failed to update role: ' + error.message);
        console.error('Error updating role:', error);
        return;
      }

      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, role } : t));
      setSuccess('Role updated successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async (id: string, department: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department: department || null })
        .eq('id', id);

      if (error) {
        setError('Failed to update department: ' + error.message);
        console.error('Error updating department:', error);
        return;
      }

      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, department } : t));
      setSuccess('Department updated successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (id: string, available: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ available })
        .eq('id', id);

      if (error) {
        setError('Failed to update availability: ' + error.message);
        console.error('Error updating availability:', error);
        return;
      }

      onTechniciansChange(technicians.map(t => t.id === id ? { ...t, available } : t));
      setSuccess('Availability updated successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeTechnician = async (id: string) => {
    if (!confirm('Are you sure you want to remove this technician? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Check if the technician has assigned equipment
      const { data: assignedEquipment } = await supabase
        .from('equipment')
        .select('id')
        .eq('assigned_to', id)
        .limit(1);

      if (assignedEquipment && assignedEquipment.length > 0) {
        setError('Cannot remove technician with assigned equipment. Please reassign equipment first.');
        return;
      }

      // Check if the technician has assigned tickets
      const { data: assignedTickets } = await supabase
        .from('tickets')
        .select('id')
        .eq('assignee_id', id)
        .limit(1);

      if (assignedTickets && assignedTickets.length > 0) {
        setError('Cannot remove technician with assigned tickets. Please reassign tickets first.');
        return;
      }

      // Delete the user from auth and profiles
      const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

      if (deleteError) {
        setError('Failed to remove technician: ' + deleteError.message);
        console.error('Error deleting user:', deleteError);
        return;
      }

      onTechniciansChange(technicians.filter(t => t.id !== id));
      setSuccess('Technician removed successfully');
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayTechnicians = technicians.filter(tech => 
    tech.role === 'technician' || tech.role === 'admin'
  );

  if (loading && technicians.length === 0) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Technician Management</h2>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Invite Technician */}
      <div className="mb-6 space-y-3 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Invite New Technician</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={inviting}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={inviting}
          />
          <select 
            value={newRole} 
            onChange={(e) => setNewRole(e.target.value)} 
            className="border rounded px-3 py-2"
            disabled={inviting}
          >
            <option value="technician">Technician</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="text"
            placeholder="Department (optional)"
            value={newDepartment}
            onChange={(e) => setNewDepartment(e.target.value)}
            className="border rounded px-3 py-2"
            disabled={inviting}
          />
        </div>
        <button 
          onClick={inviteTechnician} 
          disabled={inviting || !newName.trim() || !newEmail.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center space-x-2 disabled:bg-blue-300"
        >
          <Mail className="w-4 h-4" /> 
          <span>{inviting ? 'Sending Invitation...' : 'Invite Technician'}</span>
        </button>
      </div>

      {/* Loading overlay */}
      {(loading || inviting) && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Technicians Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {displayTechnicians.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No technicians found. Invite your first technician to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {displayTechnicians.map((tech) => (
              <div key={tech.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{tech.full_name}</h4>
                    <p className="text-sm text-gray-600">{tech.email}</p>
                    <div className="flex items-center mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tech.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tech.available ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {tech.available ? 'Available' : 'Unavailable'}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tech.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Role:</span>
                    <select
                      value={tech.role}
                      onChange={(e) => updateRole(tech.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={loading}
                    >
                      <option value="technician">Technician</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Department:</span>
                    <input
                      type="text"
                      value={tech.department || ''}
                      onChange={(e) => updateDepartment(tech.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-32"
                      placeholder="None"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Availability:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tech.available}
                        onChange={(e) => updateAvailability(tech.id, e.target.checked)}
                        className="sr-only peer"
                        disabled={loading}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2 border-t">
                  <button
                    onClick={() => resendInvitation(tech)}
                    disabled={inviting}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 disabled:opacity-50"
                    title="Resend invitation"
                  >
                    <Mail className="w-4 h-4 inline mr-1" />
                    Resend
                  </button>
                  <button
                    onClick={() => removeTechnician(tech.id)}
                    disabled={loading}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 disabled:opacity-50"
                    title="Remove technician"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;