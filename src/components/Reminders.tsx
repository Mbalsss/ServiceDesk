import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Plus, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  X,
  Trash2,
  Filter,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Types
interface Reminder {
  id: string;
  title: string;
  description: string;
  type: string;
  assignee_id: string | null;
  due_date: string;
  is_completed: boolean;
  created_at: string;
  created_by: string;
  related_ticket_id: string | null;
  profiles?: {
    full_name: string;
  };
}

const Reminders = () => {
  const [reminderList, setReminderList] = useState<Reminder[]>([]);
  const [profiles, setProfiles] = useState<{id: string, full_name: string}[]>([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'general',
    assignee_id: '',
    due_date: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load profiles and reminders from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .order('full_name', { ascending: true });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profilesData) {
          setProfiles(profilesData);
        }

        // Fetch reminders with profile data
        const { data: remindersData, error: remindersError } = await supabase
          .from('reminders')
          .select(`
            *,
            profiles:assignee_id (full_name)
          `)
          .order('due_date', { ascending: true });

        if (remindersError) {
          console.error('Error fetching reminders:', remindersError);
        } else if (remindersData) {
          setReminderList(remindersData);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for reminders
    const subscription = supabase
      .channel('reminders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reminders' }, 
        () => fetchData()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredReminders = reminderList.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'Pending') return !reminder.is_completed;
    if (filter === 'Completed') return reminder.is_completed;
    if (filter === 'Overdue') return !reminder.is_completed && new Date(reminder.due_date) < new Date();
    return reminder.type === filter;
  });

  const pendingReminders = reminderList.filter(r => !r.is_completed);
  const overdueReminders = reminderList.filter(r => !r.is_completed && new Date(r.due_date) < new Date());
  const completedReminders = reminderList.filter(r => r.is_completed);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Ticket_followup': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'Maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'Meeting': return 'text-green-600 bg-green-100 border-green-200';
      case 'General': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Ticket_followup': return <AlertTriangle className="w-4 h-4" />;
      case 'Maintenance': return <Clock className="w-4 h-4" />;
      case 'Meeting': return <Calendar className="w-4 h-4" />;
      case 'General': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: string, isCompleted: boolean) => {
    return !isCompleted && new Date(dueDate) < new Date();
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', id);

      if (error) {
        console.error('Error completing reminder:', error);
        return;
      }

      // Update local state optimistically
      setReminderList(prev => 
        prev.map(r => r.id === id ? { ...r, is_completed: true } : r)
      );
    } catch (error) {
      console.error('Failed to complete reminder:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting reminder:', error);
        return;
      }

      // Update local state optimistically
      setReminderList(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      alert('Please enter a title for the reminder');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          title: newReminder.title,
          description: newReminder.description,
          type: newReminder.type,
          assignee_id: newReminder.assignee_id || null,
          due_date: newReminder.due_date,
          is_completed: false,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select(`
          *,
          profiles:assignee_id (full_name)
        `);

      if (error) {
        console.error('Error adding reminder:', error);
        return;
      }

      if (data && data.length > 0) {
        // Update local state with the returned data
        setReminderList(prev => [...prev, data[0]]);
        setShowModal(false);
        setNewReminder({
          title: '',
          description: '',
          type: 'general',
          assignee_id: '',
          due_date: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to add reminder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for datetime-local input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading reminders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Desk Reminders</h2>
          <p className="text-gray-600">Stay on top of important tasks and follow-ups</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Add new reminder"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-blue-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-blue-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{pendingReminders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueReminders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center transition-all hover:shadow-md">
          <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedReminders.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center mb-3">
          <Filter className="w-5 h-5 text-gray-500 mr-2" />
          <h3 className="font-medium text-gray-700">Filter reminders</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all','pending','overdue','completed','ticket_followup','maintenance','meeting','general'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${filter===f?'bg-blue-100 text-blue-700 border border-blue-200':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              aria-pressed={filter === f}
            >
              {f.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.map(r => (
          <div 
            key={r.id} 
            className={`bg-white rounded-lg shadow-sm border p-4 flex flex-col md:flex-row md:justify-between transition-all duration-200 ${
              isOverdue(r.due_date, r.is_completed)
                ? 'border-red-200 bg-red-50' 
                : r.is_completed
                ? 'border-green-200 bg-green-50'
                : 'border-gray-200 hover:shadow-md'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg border ${getTypeColor(r.type)}`}>
                  {getTypeIcon(r.type)}
                </div>
                <div>
                  <h3 className={`font-medium ${r.is_completed?'text-gray-500 line-through':'text-gray-900'}`}>
                    {r.title}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(r.type)} mt-1`}>
                    {r.type.replace('_',' ')}
                  </span>
                </div>
              </div>
              {r.description && (
                <p className={`text-sm mb-3 ${r.is_completed?'text-gray-400':'text-gray-600'}`}>
                  {r.description}
                </p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-500 mt-2">
                <div className="flex items-center mb-2 sm:mb-0">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span className={isOverdue(r.due_date, r.is_completed) ? 'text-red-600 font-medium' : ''}>
                    Due: {formatDate(r.due_date)}
                  </span>
                </div>
                {r.profiles && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{r.profiles.full_name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 mt-4 md:mt-0 md:ml-4">
              {!r.is_completed && (
                <button 
                  onClick={() => handleCompleteReminder(r.id)} 
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Mark as completed"
                >
                  <CheckCircle className="w-5 h-5"/>
                </button>
              )}
              {r.is_completed && (
                <div className="flex items-center text-green-600 mr-2">
                  <CheckCircle className="w-4 h-4 mr-1"/>
                  <span className="text-xs font-medium">COMPLETED</span>
                </div>
              )}
              {isOverdue(r.due_date, r.is_completed) && (
                <div className="flex items-center text-red-600 mr-2">
                  <AlertTriangle className="w-4 h-4 mr-1"/>
                  <span className="text-xs font-medium">OVERDUE</span>
                </div>
              )}
              <button 
                onClick={() => handleDeleteReminder(r.id)} 
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Delete reminder"
              >
                <Trash2 className="w-4 h-4"/>
              </button>
            </div>
          </div>
        ))}
        {filteredReminders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
            <p className="text-gray-500">No reminders found matching your criteria.</p>
            <button 
              onClick={() => setFilter('all')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-1"
            >
              View all reminders
            </button>
          </div>
        )}
      </div>

      {/* New Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Reminder</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input 
                  id="title"
                  type="text" 
                  placeholder="Enter reminder title" 
                  value={newReminder.title} 
                  onChange={e => setNewReminder({...newReminder, title: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter description (optional)" 
                  value={newReminder.description} 
                  onChange={e => setNewReminder({...newReminder, description: e.target.value})} 
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                  Assignee
                </label>
                <select
                  id="assignee"
                  value={newReminder.assignee_id} 
                  onChange={e => setNewReminder({...newReminder, assignee_id: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {profiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input 
                  id="dueDate"
                  type="datetime-local" 
                  value={formatDateForInput(newReminder.due_date)} 
                  onChange={e => setNewReminder({...newReminder, due_date: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select 
                  id="type"
                  value={newReminder.type} 
                  onChange={e => setNewReminder({...newReminder, type: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ticket_followup">Ticket Follow-up</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="meeting">Meeting</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>
            <div className="flex mt-6 space-x-3">
              <button 
                onClick={handleAddReminder} 
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : 'Add Reminder'}
              </button>
              <button 
                onClick={() => setShowModal(false)} 
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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

export default Reminders;