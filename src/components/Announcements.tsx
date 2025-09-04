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
  Loader,
  Bell,
  CheckCircle
} from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([
    {
      id: '1',
      title: 'System Maintenance Scheduled',
      content: 'There will be a scheduled maintenance window this Saturday from 10:00 PM to 2:00 AM. During this time, the service desk portal may be unavailable.',
      category: 'maintenance',
      priority: 'high',
      author: 'IT Operations Team',
      isActive: true,
      createdAt: new Date('2023-10-15T10:00:00'),
      isRead: false,
      targetAudience: 'all'
    },
    {
      id: '2',
      title: 'New Password Policy',
      content: 'Starting next month, all passwords must be at least 12 characters long and include a combination of letters, numbers, and special characters.',
      category: 'policy',
      priority: 'medium',
      author: 'Security Team',
      isActive: true,
      createdAt: new Date('2023-10-10T14:30:00'),
      isRead: false,
      targetAudience: 'all'
    },
    {
      id: '3',
      title: 'Software Update Completed',
      content: 'The latest update to the ticketing system has been successfully deployed. New features include improved search functionality and mobile responsiveness.',
      category: 'system_update',
      priority: 'low',
      author: 'Development Team',
      isActive: true,
      createdAt: new Date('2023-10-05T09:15:00'),
      isRead: true,
      targetAudience: 'technicians'
    },
    {
      id: '4',
      title: 'Holiday Support Hours',
      content: 'During the upcoming holiday season, support hours will be adjusted. Please check the updated schedule on the portal.',
      category: 'general',
      priority: 'medium',
      author: 'Service Desk Manager',
      isActive: true,
      createdAt: new Date('2023-10-01T16:45:00'),
      isRead: true,
      targetAudience: 'all'
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'low',
    author: '',
    targetAudience: 'all'
  });
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [userRole, setUserRole] = useState('user'); // Simulated user role

  // Simulate fetching user role (in a real app, this would come from authentication)
  useEffect(() => {
    // This would typically come from your auth context or user profile
    setUserRole('technician'); // Change to 'user' to see different views
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    if (!a.isActive) return false;
    
    // Filter by category
    if (filter !== 'all' && a.category !== filter) return false;
    
    // Filter by audience
    if (audienceFilter !== 'all' && a.targetAudience !== audienceFilter) return false;
    
    // Show announcements based on user role
    if (a.targetAudience === 'technicians' && userRole !== 'technician') return false;
    
    return true;
  });

  const highPriorityAnnouncements = announcements.filter(a => a.priority === 'high' && a.isActive);
  const totalActiveAnnouncements = announcements.filter(a => a.isActive);
  const unreadAnnouncements = announcements.filter(a => a.isActive && !a.isRead);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'policy': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'system_update': return 'text-green-600 bg-green-100 border-green-200';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance': return <AlertTriangle className="w-4 h-4" />;
      case 'policy': return <Info className="w-4 h-4" />;
      case 'system_update': return <Zap className="w-4 h-4" />;
      case 'general': return <Megaphone className="w-4 h-4" />;
      default: return <Megaphone className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'All Users';
      case 'technicians': return 'Technicians Only';
      case 'users': return 'End Users Only';
      default: return audience;
    }
  };

  const handleAddAnnouncement = () => {
    const newItem = {
      ...newAnnouncement,
      id: Date.now().toString(),
      isActive: true,
      isRead: false,
      createdAt: new Date()
    };
    
    setAnnouncements([newItem, ...announcements]);
    setShowModal(false);
    setNewAnnouncement({
      title: '',
      content: '',
      category: 'general',
      priority: 'low',
      author: '',
      targetAudience: 'all'
    });
  };

  const handleMarkAsRead = (id: string) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, isRead: true } : a
    ));
  };

  const handleMarkAllAsRead = () => {
    setAnnouncements(announcements.map(a => ({ ...a, isRead: true })));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.map(a => 
      a.id === id ? { ...a, isActive: false } : a
    ));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Desk Announcements</h2>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-blue-100 p-3 rounded-lg"><Megaphone className="w-6 h-6 text-blue-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Announcements</p>
            <p className="text-2xl font-bold text-blue-600">{totalActiveAnnouncements.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{highPriorityAnnouncements.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-orange-100 p-3 rounded-lg"><Bell className="w-6 h-6 text-orange-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-orange-600">{unreadAnnouncements.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-700">Filter announcements</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="w-full mb-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {['all','maintenance','policy','system_update','general'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter===f?'bg-blue-100 text-blue-700 border border-blue-200':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {f.replace('_',' ')}
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-full">
            <span className="text-sm font-medium text-gray-700">Audience:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {['all','technicians','users'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setAudienceFilter(f)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${audienceFilter===f?'bg-blue-100 text-blue-700 border border-blue-200':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {f === 'all' ? 'All Audiences' : f === 'technicians' ? 'Technicians Only' : 'Users Only'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map(a => (
          <div 
            key={a.id} 
            className={`bg-white rounded-lg shadow-sm border p-6 relative ${a.priority==='high'?'border-red-200':a.priority==='medium'?'border-yellow-200':'border-gray-200'} ${!a.isRead ? 'ring-2 ring-blue-500' : ''}`}
          >
            {!a.isRead && (
              <div className="absolute -top-2 -right-2">
                <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">NEW</span>
              </div>
            )}
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getCategoryColor(a.category)}`}>
                  {getCategoryIcon(a.category)}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${a.isRead?'text-gray-700':'text-gray-900'}`}>
                    {a.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(a.category)}`}>
                      {a.category.replace('_',' ')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(a.priority)}`}>
                      {a.priority} priority
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {getAudienceLabel(a.targetAudience)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {!a.isRead && (
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
                  <span>{formatDate(a.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-500">No announcements found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
                  value={newAnnouncement.targetAudience} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, targetAudience: e.target.value})} 
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