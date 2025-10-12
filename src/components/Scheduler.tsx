import React, { useState, useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '../lib/supabase';
import { ScheduleEvent, User as AppUser, Task, Reminder } from '../types';

interface SchedulerProps {
  currentUser: AppUser;
  initialEvents?: ScheduleEvent[];
}

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error';
}

// Updated interfaces to match your Supabase schema
interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  type: 'Meeting' | 'Task' | 'Reminder' | 'Other';
  start_time: string;
  end_time: string;
  location: string | null;
  assignee: string | null;
  created_at: string;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  type: 'general' | 'ticket_followup' | 'maintenance' | 'meeting';
  assignee_id: string | null;
  due_date: string;
  is_completed: boolean | null;
  related_ticket_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  profiles?: {
    full_name: string;
    role?: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed';
  assignee: string | null;
  due_date: string;
  related_ticket: string | null;
  created_by: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

const Scheduler: React.FC<SchedulerProps> = ({ currentUser, initialEvents = [] }) => {
  const [eventList, setEventList] = useState<ScheduleEvent[]>(initialEvents);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [reminderList, setReminderList] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [itemType, setItemType] = useState<'event' | 'task' | 'reminder'>('event');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    type: 'Meeting',
    start_time: new Date().toISOString(),
    end_time: new Date().toISOString(),
    location: '',
    assignee: '',
  });

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignee: '',
    due_date: new Date().toISOString(),
    related_ticket: '',
  });

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'general' as 'general' | 'ticket_followup' | 'maintenance' | 'meeting',
    assignee_id: '',
    due_date: new Date().toISOString(),
  });

  // Add a notification
  const addNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    const newNotification = { id, message, type };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch profiles with roles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name', { ascending: true });
      
      if (profilesError) throw new Error(`Profiles error: ${profilesError.message}`);
      if (profilesData) {
        setProfiles(profilesData);
        // Filter technicians only
        const technicianProfiles = profilesData.filter(profile => 
          profile.role === 'technician' || profile.role === 'Technician'
        );
        setTechnicians(technicianProfiles);
      }

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (eventsError) throw new Error(`Events error: ${eventsError.message}`);
      if (eventsData) {
        setEventList(eventsData);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });
      
      if (tasksError) {
        console.log('Tasks table might not exist yet:', tasksError.message);
        setTaskList([]);
      } else if (tasksData) {
        setTaskList(tasksData);
      }

      // Fetch reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*, profiles:assignee_id (full_name, role)')
        .order('due_date', { ascending: true });
      
      if (remindersError) throw new Error(`Reminders error: ${remindersError.message}`);
      if (remindersData) setReminderList(remindersData);

    } catch (error) {
      console.error('Fetch failed:', error);
      addNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  useEffect(() => {
    const eventsChannel = supabase
      .channel('events-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'events' }, 
        fetchData
      )
      .subscribe();

    const remindersChannel = supabase
      .channel('reminders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reminders' }, 
        fetchData
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' }, 
        fetchData
      )
      .subscribe();

    return () => {
      eventsChannel.unsubscribe();
      remindersChannel.unsubscribe();
      tasksChannel.unsubscribe();
    };
  }, []);

  // Filter events based on user role
  const visibleEvents = currentUser.role === 'technician'
    ? eventList.filter(e => e.assignee === currentUser.id || e.assignee === 'all')
    : eventList;

  // Date filtering using ISO strings from database
  const todayEvents = visibleEvents.filter(e => 
    new Date(e.start_time).toDateString() === selectedDate.toDateString()
  );

  const todayTasks = taskList.filter(t => 
    new Date(t.due_date).toDateString() === selectedDate.toDateString()
  );

  const todayReminders = reminderList.filter(r => 
    new Date(r.due_date).toDateString() === selectedDate.toDateString()
  );

  // Color helpers
  const getEventTypeColor = (type: string) => {
    switch(type){
      case 'Task': return 'bg-red-100 text-red-800 border-red-200';
      case 'Meeting': return 'bg-[#F0F5FC] text-[#5483B3] border-[#5483B3]';
      case 'Reminder': return 'bg-green-100 text-green-800 border-green-200';
      case 'Other': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority){
      case 'high': return 'text-red-600 bg-red-100 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status){
      case 'pending': return 'text-[#5483B3] bg-[#F0F5FC] border-[#5483B3]';
      case 'in_progress': return 'text-[#7BA4D0] bg-blue-50 border-[#7BA4D0]';
      case 'completed': return 'text-[#5AB8A8] bg-green-50 border-[#5AB8A8]';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch(type){
      case 'ticket_followup': return 'text-[#7BA4D0] bg-blue-50 border-[#7BA4D0]';
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'meeting': return 'text-[#5483B3] bg-[#F0F5FC] border-[#5483B3]';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  // Helper function to get assignee display name
  const getAssigneeDisplayName = (assigneeId: string | null) => {
    if (assigneeId === 'all') return 'All Technicians';
    if (!assigneeId) return 'Unassigned';
    
    const profile = profiles.find(p => p.id === assigneeId);
    return profile ? profile.full_name : 'Unknown';
  };

  // Task handlers
  const handleAddTask = async () => {
    if(!newTask.title?.trim()) {
      addNotification('Please enter a title for the task', 'error');
      return;
    }
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        addNotification('You must be logged in to create tasks', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ 
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          status: newTask.status,
          assignee: newTask.assignee === 'all' ? null : newTask.assignee, // Store null for 'all'
          due_date: newTask.due_date,
          related_ticket: newTask.related_ticket,
          created_by: user.data.user.id
        }])
        .select();
        
      if(error) {
        console.error('Task creation error:', error);
        addNotification('Failed to create task', 'error');
        return;
      }
      
      if(data?.length) {
        setTaskList(prev => [...prev, data[0]]);
        setShowCreateModal(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'medium',
          status: 'pending',
          assignee: '',
          due_date: new Date().toISOString(),
          related_ticket: '',
        });
        addNotification('Task created successfully!');
      }
    } catch(e) { 
      console.error('Task creation exception:', e);
      addNotification('Failed to create task', 'error');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'completed' })
        .eq('id', taskId);
      
      if(error) {
        console.error('Task completion error:', error);
        addNotification('Failed to complete task', 'error');
        return;
      }
      
      setTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      addNotification('Task marked as completed!');
    } catch (error) {
      console.error('Task completion exception:', error);
      addNotification('Failed to complete task', 'error');
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);
      
      if(error) {
        console.error('Task deletion error:', error);
        addNotification('Failed to delete task', 'error');
        return;
      }
      
      setTaskList(prev => prev.filter(t => t.id !== taskId));
      addNotification('Task deleted successfully!');
    } catch (error) {
      console.error('Task deletion exception:', error);
      addNotification('Failed to delete task', 'error');
    }
  };

  // Reminder handlers
  const handleAddReminder = async () => {
    if(!newReminder.title.trim()) {
      addNotification('Please enter a title for the reminder', 'error');
      return;
    }
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        addNotification('You must be logged in to create reminders', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('reminders')
        .insert([{ 
          ...newReminder,
          assignee_id: newReminder.assignee_id === 'all' ? null : newReminder.assignee_id, // Store null for 'all'
          created_by: user.data.user.id
        }])
        .select('*, profiles:assignee_id (full_name, role)');
        
      if(error) {
        console.error('Reminder creation error:', error);
        addNotification('Failed to create reminder', 'error');
        return;
      }
      
      if(data?.length) {
        setReminderList(prev => [...prev, data[0]]);
        setShowCreateModal(false);
        setNewReminder({ 
          title: '', 
          description: '', 
          type: 'general', 
          assignee_id: '', 
          due_date: new Date().toISOString() 
        });
        addNotification('Reminder created successfully!');
      }
    } catch(e) { 
      console.error('Reminder creation exception:', e);
      addNotification('Failed to create reminder', 'error');
    }
  };

  const handleCompleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('reminders')
      .update({ is_completed: true })
      .eq('id', id);
    
    if(error) {
      console.error('Reminder completion error:', error);
      addNotification('Failed to complete reminder', 'error');
      return;
    }
    
    setReminderList(prev => prev.map(r => r.id === id ? { ...r, is_completed: true } : r));
    addNotification('Reminder marked as completed!');
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id);
    
    if(error) {
      console.error('Reminder deletion error:', error);
      addNotification('Failed to delete reminder', 'error');
      return;
    }
    
    setReminderList(prev => prev.filter(r => r.id !== id));
    addNotification('Reminder deleted successfully!');
  };

  // Event handlers
  const handleAddEvent = async () => {
    if(!newEvent.title?.trim()) {
      addNotification('Please enter a title for the event', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          title: newEvent.title,
          description: newEvent.description,
          type: newEvent.type,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          location: newEvent.location,
          assignee: newEvent.assignee === 'all' ? null : newEvent.assignee, // Store null for 'all'
        }])
        .select();
        
      if(error) {
        console.error('Event creation error:', error);
        addNotification('Failed to create event', 'error');
        return;
      }
      
      if(data?.length) {
        setEventList(prev => [...prev, data[0]]);
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          type: 'Meeting',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
          location: '',
          assignee: '',
        });
        addNotification('Event created successfully!');
      }
    } catch(e) { 
      console.error('Event creation exception:', e);
      addNotification('Failed to create event', 'error');
    }
  };

  // Date formatting helpers
  const formatDateForInput = (dateString: string) => {
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  if(loading) return <div className="p-6 text-gray-600">Loading events...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification Container */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`flex items-center p-3 sm:p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out max-w-xs sm:max-w-md ${
                notification.type === 'success' 
                  ? 'bg-green-50 text-green-800 border-green-200' 
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-3 flex-shrink-0 ${
                notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
              }`}></div>
              <span className="font-medium text-sm sm:text-base">{notification.message}</span>
              <button 
                onClick={() => removeNotification(notification.id)}
                className="ml-2 sm:ml-4 text-gray-500 hover:text-gray-700 flex-shrink-0"
              >
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">×</div>
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Scheduler</h2>
              <p className="text-gray-600 text-sm sm:text-base">Manage events, tasks, and reminders</p>
            </div>
            <div className="flex space-x-2">
              {currentUser.role === 'admin' && (
                <button 
                  onClick={() => setShowCreateModal(true)} 
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-[#5483B3] text-white rounded-lg hover:bg-[#3A5C80] transition-colors text-sm sm:text-base"
                >
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-[#5483B3] text-xs font-bold">+</div>
                  <span>New Item</span>
                </button>
              )}
            </div>
          </div>

          {/* Calendar and Today's Items Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Calendar */}
            <div className="lg:col-span-1">
              <ReactCalendar
                value={selectedDate}
                onChange={date => setSelectedDate(date as Date)}
                className="text-sm"
                tileContent={({ date }) => {
                  const hasEvent = visibleEvents.some(e => 
                    new Date(e.start_time).toDateString() === date.toDateString()
                  );
                  const hasTask = taskList.some(t => 
                    new Date(t.due_date).toDateString() === date.toDateString()
                  );
                  const hasReminder = reminderList.some(r => 
                    new Date(r.due_date).toDateString() === date.toDateString()
                  );
                  return (
                    <div className="flex justify-center space-x-1 mt-1">
                      {hasEvent && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#5483B3] rounded-full"></span>}
                      {hasTask && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#5AB8A8] rounded-full"></span>}
                      {hasReminder && <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#7BA4D0] rounded-full"></span>}
                    </div>
                  );
                }}
              />
            </div>

            {/* Today Lists */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Events */}
              <div className="rounded-lg shadow-sm border p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  <div className="w-4 h-4 bg-[#5483B3] rounded mr-2 inline-block"></div>
                  Today's Events
                </h4>
                {todayEvents.length > 0 ? todayEvents.map(event => (
                  <div key={event.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg mb-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{event.title}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                          {event.type}
                        </span>
                      </div>
                      {currentUser.role === 'admin' && (
                        <button className="text-red-600 hover:text-red-800 ml-2 flex-shrink-0">
                          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">×</div>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center text-gray-500 mt-1 sm:mt-2">
                      <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                      {new Date(event.start_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} - 
                      {new Date(event.end_time).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-gray-500 mt-1">
                        <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                        {event.location}
                      </div>
                    )}
                    <div className="text-gray-500 mt-1">
                      Assignee: {getAssigneeDisplayName(event.assignee)}
                    </div>
                  </div>
                )) : <p className="text-gray-500 text-sm">No events today</p>}
              </div>

              {/* Tasks */}
              <div className="rounded-lg shadow-sm border p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  <div className="w-4 h-4 bg-[#5AB8A8] rounded mr-2 inline-block"></div>
                  Today's Tasks
                </h4>
                {todayTasks.length > 0 ? todayTasks.map(task => (
                  <div key={task.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg mb-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{task.title}</h5>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        {task.status !== 'completed' && (
                          <button 
                            onClick={() => handleCompleteTask(task.id)} 
                            className="text-[#5AB8A8] hover:text-[#4AA898]"
                          >
                            <div className="w-4 h-4 bg-[#5AB8A8] rounded-full flex items-center justify-center text-white text-xs">✓</div>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          className="text-red-600 hover:text-red-800"
                        >
                          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">×</div>
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-500 mt-1 sm:mt-2">
                      Due: {new Date(task.due_date).toLocaleDateString()}
                    </div>
                    {task.related_ticket && (
                      <div className="text-gray-500 mt-1">
                        Ticket: {task.related_ticket}
                      </div>
                    )}
                    <div className="text-gray-500 mt-1">
                      Assignee: {getAssigneeDisplayName(task.assignee)}
                    </div>
                  </div>
                )) : <p className="text-gray-500 text-sm">No tasks today</p>}
              </div>

              {/* Reminders */}
              <div className="rounded-lg shadow-sm border p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                  <div className="w-4 h-4 bg-[#7BA4D0] rounded mr-2 inline-block"></div>
                  Today's Reminders
                </h4>
                {todayReminders.length > 0 ? todayReminders.map(reminder => (
                  <div key={reminder.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg mb-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium">{reminder.title}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReminderTypeColor(reminder.type)}`}>
                          {reminder.type.replace('_', ' ')}
                        </span>
                        <div className="text-gray-500 mt-1">
                          Assignee: {getAssigneeDisplayName(reminder.assignee_id)}
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2 flex-shrink-0">
                        {!reminder.is_completed && (
                          <button 
                            onClick={() => handleCompleteReminder(reminder.id)} 
                            className="text-[#5AB8A8] hover:text-[#4AA898]"
                          >
                            <div className="w-4 h-4 bg-[#5AB8A8] rounded-full flex items-center justify-center text-white text-xs">✓</div>
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteReminder(reminder.id)} 
                          className="text-red-600 hover:text-red-800"
                        >
                          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center text-white text-xs">×</div>
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-500 mt-1 sm:mt-2">
                      Due: {new Date(reminder.due_date).toLocaleString()}
                    </div>
                  </div>
                )) : <p className="text-gray-500 text-sm">No reminders today</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4 sm:my-8">
              <div className="flex justify-between items-center p-3 sm:p-4 border-b sticky top-0 bg-white z-10">
                <h3 className="text-base sm:text-lg font-semibold">
                  {itemType === 'event' && 'Create New Event'}
                  {itemType === 'task' && 'Create New Task'}
                  {itemType === 'reminder' && 'Create New Reminder'}
                </h3>
                <button 
                  onClick={() => setShowCreateModal(false)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm">×</div>
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                {/* Type Selector */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select 
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as 'event' | 'task' | 'reminder')}
                    className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                  >
                    <option value="event">Event</option>
                    <option value="task">Task</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                {/* Common Fields */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={
                      itemType === 'event' ? newEvent.title || '' :
                      itemType === 'task' ? newTask.title || '' :
                      newReminder.title
                    }
                    onChange={(e) => {
                      if (itemType === 'event') setNewEvent({...newEvent, title: e.target.value});
                      if (itemType === 'task') setNewTask({...newTask, title: e.target.value});
                      if (itemType === 'reminder') setNewReminder({...newReminder, title: e.target.value});
                    }}
                    className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                    placeholder="Enter title"
                    required
                  />
                </div>

                <div className="mb-4 sm:mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={
                      itemType === 'event' ? newEvent.description || '' :
                      itemType === 'task' ? newTask.description || '' :
                      newReminder.description
                    }
                    onChange={(e) => {
                      if (itemType === 'event') setNewEvent({...newEvent, description: e.target.value});
                      if (itemType === 'task') setNewTask({...newTask, description: e.target.value});
                      if (itemType === 'reminder') setNewReminder({...newReminder, description: e.target.value});
                    }}
                    className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                    placeholder="Enter description"
                    rows={3}
                  />
                </div>

                {/* Event Specific Fields */}
                {itemType === 'event' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                      <select
                        value={newEvent.type || 'Meeting'}
                        onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="Meeting">Meeting</option>
                        <option value="Task">Task</option>
                        <option value="Reminder">Reminder</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={newEvent.location || ''}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                        placeholder="Enter location"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formatDateForInput(newEvent.start_time || new Date().toISOString())}
                        onChange={(e) => setNewEvent({...newEvent, start_time: new Date(e.target.value).toISOString()})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={formatDateForInput(newEvent.end_time || new Date().toISOString())}
                        onChange={(e) => setNewEvent({...newEvent, end_time: new Date(e.target.value).toISOString()})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                      <select
                        value={newEvent.assignee || ''}
                        onChange={(e) => setNewEvent({...newEvent, assignee: e.target.value})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="">Select assignee</option>
                        <option value="all" className="font-semibold">
                          All Technicians
                        </option>
                        <option disabled>--- Technicians ---</option>
                        {technicians.map(technician => (
                          <option key={technician.id} value={technician.id}>
                            {technician.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Task Specific Fields */}
                {itemType === 'task' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <select
                        value={newTask.priority || 'medium'}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={newTask.status || 'pending'}
                        onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="datetime-local"
                        value={formatDateForInput(newTask.due_date || new Date().toISOString())}
                        onChange={(e) => setNewTask({...newTask, due_date: new Date(e.target.value).toISOString()})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Related Ticket</label>
                      <input
                        type="text"
                        value={newTask.related_ticket || ''}
                        onChange={(e) => setNewTask({...newTask, related_ticket: e.target.value})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                        placeholder="Enter related ticket"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                      <select
                        value={newTask.assignee || ''}
                        onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="">Select assignee</option>
                        <option value="all" className="font-semibold">
                          All Technicians
                        </option>
                        <option disabled>--- Technicians ---</option>
                        {technicians.map(technician => (
                          <option key={technician.id} value={technician.id}>
                            {technician.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Reminder Specific Fields */}
                {itemType === 'reminder' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Type</label>
                      <select
                        value={newReminder.type}
                        onChange={(e) => setNewReminder({...newReminder, type: e.target.value as any})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="general">General</option>
                        <option value="ticket_followup">Ticket Follow-up</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input
                        type="datetime-local"
                        value={formatDateForInput(newReminder.due_date)}
                        onChange={(e) => setNewReminder({...newReminder, due_date: new Date(e.target.value).toISOString()})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                      <select
                        value={newReminder.assignee_id}
                        onChange={(e) => setNewReminder({...newReminder, assignee_id: e.target.value})}
                        className="w-full p-2 sm:p-3 border rounded-md focus:ring-2 focus:ring-[#5483B3] focus:border-[#5483B3] text-sm sm:text-base"
                      >
                        <option value="">Select assignee</option>
                        <option value="all" className="font-semibold">
                          All Technicians
                        </option>
                        <option disabled>--- Technicians ---</option>
                        {technicians.map(technician => (
                          <option key={technician.id} value={technician.id}>
                            {technician.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end p-3 sm:p-4 border-t sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 sm:px-4 py-2 mr-2 sm:mr-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (itemType === 'event') handleAddEvent();
                    if (itemType === 'task') handleAddTask();
                    if (itemType === 'reminder') handleAddReminder();
                  }}
                  className="px-3 sm:px-4 py-2 bg-[#5483B3] text-white rounded-md hover:bg-[#3A5C80] text-sm sm:text-base"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scheduler;