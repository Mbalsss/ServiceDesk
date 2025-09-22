import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  AlertTriangle, 
  Info, 
  Zap, 
  User, 
  Calendar, 
  Filter, 
  Trash,
  X,
  Bell,
  CheckCircle,
  Search,
  ChevronDown,
  Check,
  Shield,
  ShieldOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'low',
    author: '',
    target_audience: 'all'
  });
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [userRole, setUserRole] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch announcements from Supabase
  useEffect(() => {
    fetchAnnouncements();
    fetchUserData();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        return;
      }

      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        // Fetch user role from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (data) {
          setUserRole(data.role);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    if (!a.is_active) return false;
    
    // Filter by category
    if (filter !== 'all' && a.category !== filter) return false;
    
    // Filter by audience
    if (audienceFilter !== 'all' && a.target_audience !== audienceFilter) return false;
    
    // Show announcements based on user role
    if (a.target_audience === 'technicians' && userRole !== 'technician') return false;
    
    // Filter by search query
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !a.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  const highPriorityAnnouncements = announcements.filter(a => a.priority === 'high' && a.is_active);
  const totalActiveAnnouncements = announcements.filter(a => a.is_active);
  const unreadAnnouncements = announcements.filter(a => a.is_active && !a.is_read);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'policy': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'system_update': return 'text-green-600 bg-green-100 border-green-200';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      case 'policy': return <Info className="w-4 h-4" />;
      case 'system_update': return <Zap className="w-4 h-4" />;
      case 'general': return <Megaphone className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAudienceLabel = (audience) => {
    switch (audience) {
      case 'all': return 'All Users';
      case 'technicians': return 'Technicians Only';
      case 'users': return 'End Users Only';
      default: return audience;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'all': return 'All Categories';
      case 'maintenance': return 'Maintenance';
      case 'policy': return 'Policy Update';
      case 'system_update': return 'System Update';
      case 'general': return 'General';
      default: return category;
    }
  };

  const formatDisplayValue = (value) => {
    // Capitalize first letter of each word
    return value.replace(/_/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1))
               .join(' ');
  };

  const handleAddAnnouncement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newItem = {
        ...newAnnouncement,
        is_active: true,
        is_read: true, // Creator automatically marks as read
        created_at: new Date().toISOString(),
        author: newAnnouncement.author || user?.email || 'Unknown'
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert([newItem])
        .select();

      if (error) {
        console.error('Error adding announcement:', error);
        setErrorMessage('Failed to create announcement. Please try again.');
        setShowError(true);
        return;
      }

      if (data && data.length > 0) {
        // Add the new announcement to the beginning of the list
        setAnnouncements(prev => [data[0], ...prev]);
        
        // Show success message
        setSuccessMessage('Announcement created successfully!');
        setShowSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccess(false);
        }, 3000);
      }

      setShowModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        category: 'general',
        priority: 'low',
        author: '',
        target_audience: 'all'
      });
    } catch (error) {
      console.error('Error adding announcement:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Error marking as read:', error);
        return;
      }

      // Update the UI
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(a => 
          a.id === id ? { ...a, is_read: true } : a
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_read: true })
        .eq('is_active', true);

      if (error) {
        console.error('Error marking all as read:', error);
        return;
      }

      // Update the UI
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(a => ({ ...a, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      // Perform a soft delete by setting is_active to false
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting announcement:', error);
        setErrorMessage('Failed to delete announcement. Please try again.');
        setShowError(true);
        return;
      }

      // Update the UI by removing the deleted announcement from state
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.filter(a => a.id !== id)
      );
      
      // Show success message
      setSuccessMessage('Announcement deleted successfully!');
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <span>{successMessage}</span>
            <button 
              onClick={() => setShowSuccess(false)}
              className="ml-4 text-green-700 hover:text-green-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {showError && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-md flex items-center">
            <ShieldOff className="w-5 h-5 mr-2" />
            <span>{errorMessage}</span>
            <button 
              onClick={() => setShowError(false)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Desk Announcements</h1>
              <p className="text-gray-600">Important updates and notifications for users and technicians</p>
            </div>
            <div className="flex gap-2">
              {unreadAnnouncements.length > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark All as Read</span>
                </button>
              )}
              <button 
                onClick={() => setShowModal(true)} 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Announcement</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 bg-gray-50 rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 text-gray-500" />
              <span>Filters</span>
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Category</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-left"
                    >
                      <span>{getCategoryLabel(filter)}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {categoryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['all', 'maintenance', 'policy', 'system_update', 'general'].map(f => (
                          <button 
                            key={f} 
                            onClick={() => {
                              setFilter(f);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${filter === f ? 'bg-blue-50 text-blue-700' : ''}`}
                          >
                            {getCategoryLabel(f)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Audience</h3>
                  <div className="relative">
                    <button 
                      onClick={() => setAudienceDropdownOpen(!audienceDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg text-left"
                    >
                      <span>{getAudienceLabel(audienceFilter)}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    
                    {audienceDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                        {['all', 'technicians', 'users'].map(f => (
                          <button 
                            key={f} 
                            onClick={() => {
                              setAudienceFilter(f);
                              setAudienceDropdownOpen(false);
                            }}
                            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${audienceFilter === f ? 'bg-blue-50 text-blue-700' : ''}`}
                          >
                            {getAudienceLabel(f)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between">
                <span className="text-sm text-gray-500">
                  Showing {filteredAnnouncements.length} of {totalActiveAnnouncements.length} announcements
                </span>
                <button 
                  onClick={() => {
                    setFilter('all');
                    setAudienceFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-xl p-6 flex items-center border border-blue-100">
            <div className="bg-blue-100 p-4 rounded-xl"><Megaphone className="w-8 h-8 text-blue-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Announcements</p>
              <p className="text-2xl font-bold text-blue-600">{totalActiveAnnouncements.length}</p>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-6 flex items-center border border-red-100">
            <div className="bg-red-100 p-4 rounded-xl"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-red-600">{highPriorityAnnouncements.length}</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-6 flex items-center border border-orange-100">
            <div className="bg-orange-100 p-4 rounded-xl"><Bell className="w-8 h-8 text-orange-600" /></div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-orange-600">{unreadAnnouncements.length}</p>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Announcements</h2>
          
          {filteredAnnouncements.length > 0 ? (
            <div className="space-y-6">
              {filteredAnnouncements.map(a => (
                <div 
                  key={a.id} 
                  className={`bg-gray-50 rounded-xl border p-6 relative ${a.priority==='high'?'border-red-200':a.priority==='medium'?'border-yellow-200':'border-gray-200'} ${!a.is_read ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {!a.is_read && (
                    <div className="absolute -top-2 -right-2">
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl border ${getCategoryColor(a.category)}`}>
                        {getCategoryIcon(a.category)}
                      </div>
                      <div>
                        <h3 className={`text-xl font-semibold ${a.is_read?'text-gray-700':'text-gray-900'}`}>
                          {a.title}
                        </h3>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(a.category)}`}>
                            {formatDisplayValue(a.category)}
                          </span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(a.priority)}`}>
                            {formatDisplayValue(a.priority)} Priority
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {getAudienceLabel(a.target_audience)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      {/* Only show "Mark as Read" for announcements not created by current user */}
                      {!a.is_read && currentUser && a.author !== currentUser.email && (
                        <button 
                          onClick={() => handleMarkAsRead(a.id)} 
                          className="px-3 py-1 text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                        >
                          Mark as Read
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteAnnouncement(a.id)} 
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash className="w-4 h-4"/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1"/>
                        <span>By {a.author}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1"/>
                        <span>{formatDate(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
              <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
              <p className="text-gray-500 text-lg">No announcements found matching your criteria.</p>
              <button 
                onClick={() => {
                  setFilter('all');
                  setAudienceFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-800"
                >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Announcement</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  placeholder="Enter announcement title" 
                  value={newAnnouncement.title} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea 
                  placeholder="Enter announcement content" 
                  value={newAnnouncement.content} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} 
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input 
                  type="text" 
                  placeholder="Enter your name or team" 
                  value={newAnnouncement.author} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, author: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newAnnouncement.category} 
                    onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="maintenance">Maintenance</option>
                    <option value="policy">Policy Update</option>
                    <option value="system_update">System Update</option>
                    <option value="general">General</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select 
                    value={newAnnouncement.priority} 
                    onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select 
                  value={newAnnouncement.target_audience} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="technicians">Technicians Only</option>
                  <option value="users">End Users Only</option>
                </select>
              </div>
            </div>
            
            <div className="flex mt-6 space-x-3">
              <button 
                onClick={handleAddAnnouncement} 
                disabled={!newAnnouncement.title || !newAnnouncement.content}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish Announcement
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;