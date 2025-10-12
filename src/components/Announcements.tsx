import React, { useState, useEffect } from 'react';
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
  const [userRole, setUserRole] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedAnnouncements, setExpandedAnnouncements] = useState(new Set());

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

      if (error) throw error;
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
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (data) setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => {
    if (!announcement.is_active) return false;
    
    if (filter !== 'all' && announcement.category !== filter) return false;
    
    if (announcement.target_audience === 'technicians' && userRole !== 'technician') return false;
    if (announcement.target_audience === 'users' && userRole === 'technician') return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return announcement.title.toLowerCase().includes(query) || 
             announcement.content.toLowerCase().includes(query);
    }
    
    return true;
  });

  const getCategoryConfig = (category) => {
    const configs = {
      maintenance: { 
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'Maintenance'
      },
      policy: { 
        bg: 'bg-[#F0F5FC]',
        border: 'border-[#5483B3]',
        text: 'text-[#5483B3]',
        label: 'Policy'
      },
      system_update: { 
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'System Update'
      },
      general: { 
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        label: 'General'
      }
    };
    return configs[category] || configs.general;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { label: 'High', bg: 'bg-red-100', text: 'text-red-700' },
      medium: { label: 'Medium', bg: 'bg-yellow-100', text: 'text-yellow-700' },
      low: { label: 'Low', bg: 'bg-green-100', text: 'text-green-700' }
    };
    return configs[priority] || configs.low;
  };

  const getAudienceConfig = (audience) => {
    const configs = {
      all: { label: 'All Users', bg: 'bg-[#F0F5FC]', text: 'text-[#5483B3]' },
      technicians: { label: 'Technicians', bg: 'bg-blue-50', text: 'text-[#7BA4D0]' },
      users: { label: 'End Users', bg: 'bg-green-50', text: 'text-[#5AB8A8]' }
    };
    return configs[audience] || configs.all;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedAnnouncements);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedAnnouncements(newExpanded);
  };

  const handleAddAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const announcementData = {
        ...newAnnouncement,
        is_active: true,
        is_read: false,
        created_at: new Date().toISOString(),
        author: newAnnouncement.author || user?.email || 'Admin'
      };

      const { data, error } = await supabase
        .from('announcements')
        .insert([announcementData])
        .select();

      if (error) throw error;

      setAnnouncements(prev => [data[0], ...prev]);
      setSuccessMessage('Announcement published successfully!');
      setShowSuccess(true);
      setShowModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        category: 'general',
        priority: 'low',
        author: '',
        target_audience: 'all'
      });

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating announcement:', error);
      setSuccessMessage('Error creating announcement');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => 
        prev.map(a => a.id === id ? { ...a, is_read: true } : a)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));
      setSuccessMessage('Announcement deleted successfully');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = announcements.filter(a => a.is_active && !a.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5483B3] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 text-green-800 px-4 sm:px-6 py-3 rounded-lg shadow-lg border border-green-200 flex items-center space-x-2 max-w-xs sm:max-w-md">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-600 rounded-full flex-shrink-0"></div>
            <span className="font-medium text-sm sm:text-base">{successMessage}</span>
            <button 
              onClick={() => setShowSuccess(false)}
              className="ml-2 sm:ml-4 text-green-600 hover:text-green-800 flex-shrink-0"
            >
              <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">×</div>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Announcements</h1>
              <p className="text-gray-600 text-sm sm:text-base">Stay updated with system news and updates</p>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={() => {
                    filteredAnnouncements.forEach(a => {
                      if (!a.is_read) handleMarkAsRead(a.id);
                    });
                  }}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-gray-300 transition-all shadow-sm hover:shadow text-xs sm:text-sm"
                >
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-[#5483B3] rounded-full flex items-center justify-center text-white text-xs">✓</div>
                  <span>Mark All Read</span>
                  <span className="bg-[#5483B3] text-white text-xs rounded-full px-2 py-1 min-w-6">
                    {unreadCount}
                  </span>
                </button>
              )}
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#3A5C80] transition-all shadow hover:shadow-md text-xs sm:text-sm"
              >
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center text-[#5483B3] text-xs font-bold">+</div>
                <span>New Announcement</span>
              </button>
            </div>
          </div>

          {/* Stats and Search */}
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="w-4 h-4 bg-gray-400 rounded absolute left-3 top-1/2 transform -translate-y-1/2"></div>
                  <input
                    type="text"
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-all text-sm sm:text-base"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {['all', 'general', 'maintenance', 'policy', 'system_update'].map(category => {
                  const config = category === 'all' ? { bg: 'bg-gray-100', text: 'text-gray-700' } : getCategoryConfig(category);
                  const isActive = filter === category;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setFilter(category)}
                      className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                        isActive 
                          ? 'bg-[#5483B3] text-white shadow' 
                          : `${config.bg} ${config.text} border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow`
                      }`}
                    >
                      {category === 'all' ? 'All' : config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        <div className="grid gap-3 sm:gap-4">
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map(announcement => {
              const categoryConfig = getCategoryConfig(announcement.category);
              const priorityConfig = getPriorityConfig(announcement.priority);
              const audienceConfig = getAudienceConfig(announcement.target_audience);
              const isExpanded = expandedAnnouncements.has(announcement.id);

              return (
                <div 
                  key={announcement.id}
                  className={`bg-white rounded-lg shadow-sm border transition-all hover:shadow ${
                    !announcement.is_read ? 'ring-1 ring-[#5483B3] border-[#5483B3]' : 'border-gray-200'
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${categoryConfig.bg} ${categoryConfig.border} flex-shrink-0`}>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-current rounded"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 break-words">
                            {announcement.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryConfig.bg} ${categoryConfig.text}`}>
                              {categoryConfig.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityConfig.bg} ${priorityConfig.text}`}>
                              {priorityConfig.label}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${audienceConfig.bg} ${audienceConfig.text}`}>
                              <div className="w-3 h-3 bg-current rounded mr-1"></div>
                              {audienceConfig.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                        {!announcement.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(announcement.id)}
                            className="p-1.5 text-gray-400 hover:text-[#5AB8A8] hover:bg-green-50 rounded transition-colors"
                            title="Mark as read"
                          >
                            <div className="w-4 h-4 bg-[#5AB8A8] rounded-full flex items-center justify-center text-white text-xs">✓</div>
                          </button>
                        )}
                        {(userRole === 'admin' || userRole === 'technician') && (
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete announcement"
                          >
                            <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">×</div>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className={`text-gray-700 leading-relaxed transition-all break-words text-sm sm:text-base ${
                        isExpanded ? '' : 'line-clamp-3'
                      }`}>
                        {announcement.content}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-500 flex-wrap gap-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded mr-1 sm:mr-2"></div>
                          <span className="break-words">{announcement.author || 'System'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded mr-1 sm:mr-2"></div>
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleExpand(announcement.id)}
                        className="text-[#5483B3] hover:text-[#3A5C80] font-medium text-xs sm:text-sm flex items-center space-x-1 self-start sm:self-auto"
                      >
                        <span>{isExpanded ? 'Show less' : 'Read more'}</span>
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 bg-[#5483B3] rounded transition-transform ${isExpanded ? 'rotate-180' : ''}`}></div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-300 rounded-lg mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-500 text-base sm:text-lg mb-1 sm:mb-2">No announcements found</p>
              <p className="text-gray-400 text-xs sm:text-sm">
                {searchQuery || filter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create a new announcement to get started'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">New Announcement</h3>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                >
                  <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">×</div>
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Title *</label>
                <input 
                  type="text" 
                  placeholder="Enter announcement title"
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-all text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Content *</label>
                <textarea 
                  placeholder="Enter announcement content"
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-all resize-vertical text-sm sm:text-base"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Category</label>
                  <select 
                    value={newAnnouncement.category}
                    onChange={e => setNewAnnouncement({...newAnnouncement, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                  >
                    <option value="general">General</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="policy">Policy</option>
                    <option value="system_update">System Update</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Priority</label>
                  <select 
                    value={newAnnouncement.priority}
                    onChange={e => setNewAnnouncement({...newAnnouncement, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Audience</label>
                <select 
                  value={newAnnouncement.target_audience}
                  onChange={e => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                >
                  <option value="all">All Users</option>
                  <option value="technicians">Technicians Only</option>
                  <option value="users">End Users Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">Author</label>
                <input 
                  type="text" 
                  placeholder="Your name or department"
                  value={newAnnouncement.author}
                  onChange={e => setNewAnnouncement({...newAnnouncement, author: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] transition-all text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={handleAddAnnouncement}
                disabled={!newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                className="flex-1 px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#3A5C80] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base"
              >
                Publish Announcement
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium text-sm sm:text-base"
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