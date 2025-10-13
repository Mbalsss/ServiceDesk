import React, { useState, useEffect } from 'react';
import { Trash2, Loader, Users, Edit, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserAccount {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  available: boolean;
  isactive: boolean;
  created_at: string;
  updated_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    role: '',
    department: ''
  });

  // Fetch users
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      return;
    }

    if (data) {
      setUsers(data as UserAccount[]);
    }
  };

  useEffect(() => {
    fetchUsers().finally(() => setLoading(false));
  }, []);

  // Format date safely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Open edit modal
  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department || ''
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ full_name: '', email: '', role: '', department: '' });
  };

  // Update user details
  const updateUserDetails = async () => {
    if (!editingUser) return;

    setActionLoading(`edit-${editingUser.id}`);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: editForm.full_name,
          email: editForm.email,
          role: editForm.role,
          department: editForm.department || null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      await fetchUsers();
      setSuccess('User details updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      closeEditModal();
    } catch (error: any) {
      setError('Failed to update user details: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (id: string, isactive: boolean) => {
    setActionLoading(`status-${id}`);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          isactive, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      await fetchUsers();
      setSuccess(`User ${isactive ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      setError('Failed to update user status: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Remove user - FIXED VERSION
  const removeUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    setActionLoading(`delete-${id}`);
    setError(null);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.id === id) {
        throw new Error('You cannot delete your own account');
      }

      // Check for assigned tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('id, title')
        .or(`assignee_id.eq.${id},requester_id.eq.${id}`)
        .limit(5);

      if (tickets && tickets.length > 0) {
        const ticketTitles = tickets.map(t => t.title).join(', ');
        throw new Error(`Cannot delete user with assigned tickets. Please reassign tickets first. Affected tickets: ${ticketTitles}`);
      }

      // Check for assigned equipment
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id, name')
        .eq('assigned_to', id)
        .limit(5);

      if (equipment && equipment.length > 0) {
        const equipmentNames = equipment.map(e => e.name).join(', ');
        throw new Error(`Cannot delete user with assigned equipment. Please reassign equipment first. Affected equipment: ${equipmentNames}`);
      }

      // Check if user is the last admin
      const { data: adminUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('isactive', true)
        .neq('id', id);

      if (!adminUsers || adminUsers.length === 0) {
        throw new Error('Cannot delete the last active administrator. Please assign another user as admin first.');
      }

      // Try to delete using admin API
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(id);
      
      if (deleteAuthError) {
        // Fallback to soft delete
        const { error: softDeleteError } = await supabase
          .from('profiles')
          .update({ 
            isactive: false,
            full_name: 'Deleted User',
            email: `deleted-${id}@example.com`,
            department: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (softDeleteError) throw softDeleteError;
        
        setSuccess('User deactivated and anonymized successfully!');
      } else {
        // ✅ FIXED: Also delete from profiles table when Auth deletion succeeds
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (deleteProfileError) {
          console.error('Failed to delete profile record:', deleteProfileError);
          // Even if profile deletion fails, we should still proceed since auth user is deleted
          setSuccess('User authentication deleted but profile record may still exist.');
        } else {
          setSuccess('User permanently deleted successfully!');
        }
      }

      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Failed to delete user: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 mx-auto mb-4 animate-spin text-[#5483B3]" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#F0F5FC] rounded-lg">
              <Users className="w-6 h-6 text-[#5483B3]" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage system users and their access levels</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {users.length} user{users.length !== 1 ? 's' : ''} total
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
            <div className="flex-1">{success}</div>
            <button onClick={() => setSuccess(null)} className="text-green-700 hover:text-green-900">
              ×
            </button>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-600 mt-1">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-[#F0F5FC] text-[#5483B3] border border-[#5483B3]'
                          : user.role === 'technician'
                          ? 'bg-blue-50 text-[#7BA4D0] border border-[#7BA4D0]'
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isactive 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.isactive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => toggleUserStatus(user.id, !user.isactive)}
                          disabled={actionLoading !== null}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                            user.isactive 
                              ? 'border-[#D0857B] text-[#D0857B] hover:bg-red-50' 
                              : 'border-[#5AB8A8] text-[#5AB8A8] hover:bg-green-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {actionLoading === `status-${user.id}` ? (
                            <Loader className="w-3 h-3 animate-spin inline mr-1" />
                          ) : null}
                          {user.isactive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {user.department || 'No department'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-400">
                        {formatDate(user.updated_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          disabled={actionLoading !== null}
                          className="bg-[#F0F5FC] text-[#5483B3] hover:bg-[#E0EAF8] border border-[#5483B3] text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          title="Edit user details"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => removeUser(user.id)}
                          disabled={actionLoading !== null}
                          className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                          title="Permanently delete user"
                        >
                          {actionLoading === `delete-${user.id}` ? (
                            <Loader className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 text-base">{user.full_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => openEditModal(user)}
                    disabled={actionLoading !== null}
                    className="text-[#5483B3] hover:text-[#3A5C80] p-1"
                    title="Edit user details"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeUser(user.id)}
                    disabled={actionLoading !== null}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete user"
                  >
                    {actionLoading === `delete-${user.id}` ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Role:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-[#F0F5FC] text-[#5483B3] border border-[#5483B3]'
                      : user.role === 'technician'
                      ? 'bg-blue-50 text-[#7BA4D0] border border-[#7BA4D0]'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
                
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.isactive 
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {user.isactive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-gray-500">Department:</span>
                  <span className="ml-2 text-gray-700">
                    {user.department || 'No department'}
                  </span>
                </div>

                <div className="col-span-2 flex items-center text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  <span className="text-xs">Updated: {formatDate(user.updated_at)}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  onClick={() => toggleUserStatus(user.id, !user.isactive)}
                  disabled={actionLoading !== null}
                  className={`w-full text-xs px-3 py-2 rounded-lg border transition-colors ${
                    user.isactive 
                      ? 'border-[#D0857B] text-[#D0857B] hover:bg-red-50' 
                      : 'border-[#5AB8A8] text-[#5AB8A8] hover:bg-green-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading === `status-${user.id}` ? (
                    <Loader className="w-3 h-3 animate-spin inline mr-1" />
                  ) : null}
                  {user.isactive ? 'Deactivate User' : 'Activate User'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">There are no users in the system.</p>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Edit User Details</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select 
                    value={editForm.role} 
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-transparent"
                  >
                    <option value="admin">Administrator</option>
                    <option value="technician">Technician</option>
                    <option value="user">User</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={e => setEditForm({...editForm, department: e.target.value})}
                    placeholder="Enter department"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="border-t border-gray-200 px-4 sm:px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateUserDetails}
                  disabled={actionLoading !== null}
                  className="px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#3A5C80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {actionLoading === `edit-${editingUser.id}` && (
                    <Loader className="w-4 h-4 animate-spin" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;