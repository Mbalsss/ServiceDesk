import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  status: 'Online' | 'Offline' | 'Busy' | 'Away' | 'invited';
  isactive: boolean;
  updated_at: string;
}

const Agents: React.FC = () => {
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Invite technician states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFullName, setInviteFullName] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    busy: 0,
    away: 0,
    offline: 0,
    invited: 0,
    active: 0,
    inactive: 0
  });

  // Fetch technicians on component mount
  useEffect(() => {
    fetchTechnicians();
  }, []);

  // Subscribe to real-time updates for status changes
  useEffect(() => {
    const channel = supabase
      .channel('technicians-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.technician'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          // Refresh the technicians list when any change occurs
          fetchTechnicians();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update stats when technicians change
  useEffect(() => {
    if (technicians.length > 0) {
      const stats = {
        total: technicians.length,
        online: technicians.filter(t => t.status === 'Online' && t.isactive).length,
        busy: technicians.filter(t => t.status === 'Busy' && t.isactive).length,
        away: technicians.filter(t => t.status === 'Away' && t.isactive).length,
        offline: technicians.filter(t => t.status === 'Offline' && t.isactive).length,
        invited: technicians.filter(t => t.status === 'invited' && t.isactive).length,
        active: technicians.filter(t => t.isactive).length,
        inactive: technicians.filter(t => !t.isactive).length
      };
      setStats(stats);
    }
  }, [technicians]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Clear invite messages after 5 seconds
  useEffect(() => {
    if (inviteError || inviteSuccess) {
      const timer = setTimeout(() => {
        setInviteError(null);
        setInviteSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [inviteError, inviteSuccess]);

  const fetchTechnicians = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching technicians...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching technicians:', error);
        setError('Error fetching technicians: ' + error.message);
        return;
      }
      
      console.log('Fetched technicians:', data);
      
      if (data) {
        setTechnicians(data as Profile[]);
      } else {
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Unexpected error fetching technicians');
    } finally {
      setLoading(false);
    }
  };

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

      console.log('Sending invitation to:', inviteEmail);
      
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

      const responseData = await response.json();
      console.log('Invitation response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || `Failed to invite technician (Status: ${response.status})`);
      }

      setInviteSuccess('Technician invited successfully! They will remain in "Invited" status until they accept the invitation and complete their account setup.');
      setInviteEmail('');
      setInviteFullName('');
      setInviteDepartment('');
      
      // Refresh the technicians list to show the new invited technician
      setTimeout(() => {
        fetchTechnicians();
      }, 1500);
      
    } catch (err: any) {
      console.error('Invitation error:', err);
      setInviteError(err.message || 'An unexpected error occurred');
    } finally {
      setInviteLoading(false);
    }
  };

  // Get status color - including the new 'invited' status
  const getStatusColor = (status: Profile['status'], isactive: boolean) => {
    if (!isactive) {
      return 'bg-gray-100 text-gray-600 border-gray-300';
    }

    switch (status) {
      case 'Online':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Busy':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Away':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'invited':
        return 'bg-[#F0F5FC] text-[#5483B3] border-[#5483B3]';
      case 'Offline':
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  // Filter technicians based on search and status - including invited status
  const filteredTechnicians = technicians
    .filter(tech => tech.role === 'technician')
    .filter(tech => {
      const matchesSearch = tech.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tech.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (tech.department && tech.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'online' && tech.status === 'Online') ||
                           (statusFilter === 'busy' && tech.status === 'Busy') ||
                           (statusFilter === 'away' && tech.status === 'Away') ||
                           (statusFilter === 'offline' && tech.status === 'Offline') ||
                           (statusFilter === 'invited' && tech.status === 'invited');
      
      return matchesSearch && matchesStatus;
    });

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Technician Management</h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Monitor technician availability and manage invitations</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-xs">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-xs">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Online</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 mt-1">{stats.online}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-xs">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Invited</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#5483B3] mt-1">{stats.invited}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-xs">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600 mt-1">{stats.inactive}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Left Column - Invite Form */}
              <div className="xl:col-span-1">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
                  <div className="mb-3 sm:mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      Invite Technician
                    </h2>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {inviteError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
                        <p className="text-red-800 font-medium">Error</p>
                        <p className="text-red-700 text-xs sm:text-sm">{inviteError}</p>
                      </div>
                    )}

                    {inviteSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                        <p className="text-green-800 font-medium">Success</p>
                        <p className="text-green-700 text-xs sm:text-sm">{inviteSuccess}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Full Name</label>
                      <input
                        type="text"
                        placeholder="Enter full name"
                        value={inviteFullName}
                        onChange={e => setInviteFullName(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3]"
                        disabled={inviteLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3]"
                        disabled={inviteLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Department (Optional)</label>
                      <input
                        type="text"
                        placeholder="Enter department"
                        value={inviteDepartment}
                        onChange={e => setInviteDepartment(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3]"
                        disabled={inviteLoading}
                      />
                    </div>
                    
                    <button
                      onClick={inviteTechnician}
                      disabled={inviteLoading || !inviteEmail.trim() || !inviteFullName.trim()}
                      className="w-full bg-[#5483B3] text-white px-4 py-2.5 sm:py-3 rounded-lg disabled:bg-[#7BA4D0] hover:bg-[#3A5C80] transition-colors font-medium text-sm sm:text-base"
                    >
                      {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Technicians List */}
              <div className="xl:col-span-2">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 sm:p-5">
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Technician Availability</h2>
                        <p className="text-xs sm:text-sm text-gray-600">Real-time status updates</p>
                      </div>
                      <div className="bg-[#F0F5FC] text-[#5483B3] text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full font-medium border border-[#5483B3]">
                        {filteredTechnicians.length} technicians
                      </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search by name, email, or department..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] bg-white"
                        />
                      </div>
                      <div className="sm:w-40">
                        <select
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] bg-white"
                        >
                          <option value="all">All Status</option>
                          <option value="online">Online</option>
                          <option value="busy">Busy</option>
                          <option value="away">Away</option>
                          <option value="offline">Offline</option>
                          <option value="invited">Invited</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Technicians List */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="divide-y divide-gray-200 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                      {loading ? (
                        <div className="p-6 sm:p-8 text-center">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3 border-2 border-[#5483B3] border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-gray-600 text-xs sm:text-sm">Loading technicians...</p>
                        </div>
                      ) : filteredTechnicians.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                          <p className="text-gray-600 text-sm">
                            {technicians.length === 0 ? 'No technicians found' : 'No technicians match your search'}
                          </p>
                          {searchTerm || statusFilter !== 'all' ? (
                            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
                          ) : null}
                        </div>
                      ) : (
                        filteredTechnicians.map(tech => {
                          const statusColor = getStatusColor(tech.status, tech.isactive);
                          
                          return (
                            <div key={tech.id} className="p-3 sm:p-4 hover:bg-gray-50/50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#F0F5FC] rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="w-4 h-4 bg-[#5483B3] rounded"></div>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <h3 className="font-semibold text-gray-900 text-sm truncate">{tech.full_name}</h3>
                                      {!tech.isactive && (
                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 flex-shrink-0">
                                          Inactive
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-gray-600 text-xs mt-0.5 truncate">{tech.email}</p>
                                    {tech.department && (
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">{tech.department}</p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                                  <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${statusColor}`}>
                                    <span className="hidden sm:inline">{tech.status === 'invited' ? 'Invited' : tech.status}</span>
                                    <span className="sm:hidden">{tech.status === 'invited' ? 'Inv' : tech.status.charAt(0)}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                                    Updated: {new Date(tech.updated_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Error/Success Messages */}
        {error && (
          <div className="fixed top-4 right-4 max-w-xs sm:max-w-md z-50">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 shadow-lg text-sm">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="fixed top-4 right-4 max-w-xs sm:max-w-md z-50">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 shadow-lg text-sm">
              <p className="text-green-800 font-medium">Success</p>
              <p className="text-green-700 text-xs sm:text-sm">{success}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agents;