import React, { useState } from 'react';
import { Megaphone, Plus, AlertTriangle, Info, Settings, Zap, User, Calendar, Filter, Trash } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementsProps {
  announcements: Announcement[];
}

const Announcements: React.FC<AnnouncementsProps> = ({ announcements }) => {
  const [announcementList, setAnnouncementList] = useState<Announcement[]>(announcements);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement>({
    id: '',
    title: '',
    content: '',
    category: 'general',
    priority: 'low',
    author: '',
    isActive: true,
    createdAt: new Date(),
    isRead: false,
  });

  const filteredAnnouncements = announcementList.filter(a => {
    if (filter === 'all') return a.isActive;
    return a.category === filter && a.isActive;
  });

  const highPriorityAnnouncements = announcementList.filter(a => a.priority === 'high' && a.isActive);
  const totalActiveAnnouncements = announcementList.filter(a => a.isActive);

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

  const handleAddAnnouncement = () => {
    setAnnouncementList([...announcementList, { ...newAnnouncement, id: Date.now().toString() }]);
    setShowModal(false);
    setNewAnnouncement({
      id: '',
      title: '',
      content: '',
      category: 'general',
      priority: 'low',
      author: '',
      isActive: true,
      createdAt: new Date(),
      isRead: false,
    });
  };

  const handleMarkAsRead = (id: string) => {
    setAnnouncementList(announcementList.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncementList(announcementList.filter(a => a.id !== id));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Announcements</h2>
          <p className="text-gray-600">Important updates and notifications for the team</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg"><Megaphone className="w-6 h-6 text-blue-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Announcements</p>
            <p className="text-2xl font-bold text-blue-600">{totalActiveAnnouncements.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
          <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">High Priority</p>
            <p className="text-2xl font-bold text-red-600">{highPriorityAnnouncements.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-2">
        {['all','maintenance','policy','system_update','general'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter===f?'bg-blue-100 text-blue-700 border border-blue-200':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map(a => (
          <div key={a.id} className={`bg-white rounded-lg shadow-sm border p-6 ${a.priority==='high'?'border-red-200':'border-gray-200'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getCategoryColor(a.category)}`}>{getCategoryIcon(a.category)}</div>
                <div>
                  <h3 className={`text-lg font-semibold ${a.isRead?'text-gray-400 line-through':'text-gray-900'}`}>{a.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(a.category)}`}>{a.category.replace('_',' ')}</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(a.priority)}`}>{a.priority} priority</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button onClick={()=>handleMarkAsRead(a.id)} className="px-3 py-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors">Mark as Read</button>
                <button onClick={()=>handleDeleteAnnouncement(a.id)} className="px-3 py-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash className="w-4 h-4"/></button>
              </div>
            </div>
            
            <div className="mb-4"><p className={`text-gray-700 leading-relaxed ${a.isRead?'line-through':''}`}>{a.content}</p></div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center"><User className="w-4 h-4 mr-1"/><span>By {a.author}</span></div>
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-1"/><span>{a.createdAt.toLocaleDateString()}</span></div>
              </div>
            </div>
          </div>
        ))}
        {filteredAnnouncements.length===0 && <div className="text-center py-12"><Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4"/><p className="text-gray-500">No announcements found in this category.</p></div>}
      </div>

      {/* New Announcement Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Announcement</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={newAnnouncement.title} onChange={e=>setNewAnnouncement({...newAnnouncement,title:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <textarea placeholder="Content" value={newAnnouncement.content} onChange={e=>setNewAnnouncement({...newAnnouncement,content:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="text" placeholder="Author" value={newAnnouncement.author} onChange={e=>setNewAnnouncement({...newAnnouncement,author:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <select value={newAnnouncement.category} onChange={e=>setNewAnnouncement({...newAnnouncement,category:e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="maintenance">Maintenance</option>
                <option value="policy">Policy Updates</option>
                <option value="system_update">System Updates</option>
                <option value="general">General</option>
              </select>
              <select value={newAnnouncement.priority} onChange={e=>setNewAnnouncement({...newAnnouncement,priority:e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex mt-4 space-x-3">
              <button onClick={handleAddAnnouncement} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Announcement</button>
              <button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
