import React, { useState, useEffect } from 'react';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { 
  Clock, Plus, MapPin, Trash, CheckSquare, Bell, CheckCircle, 
  Calendar, User, X, Calendar as CalendarIcon, ListTodo, AlarmClock, Check
} from 'lucide-react';
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

const Scheduler: React.FC<SchedulerProps> = ({ currentUser, initialEvents = [] }) => {
  const [eventList, setEventList] = useState<ScheduleEvent[]>(initialEvents);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [reminderList, setReminderList] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<{id: string, full_name: string}[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [itemType, setItemType] = useState<'event' | 'task' | 'reminder'>('event');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    type: 'meeting',
    start_time: new Date(),
    end_time: new Date(),
    location: '',
    assignee: '',
  });

  const [newTask, setNewTask] = useState<Task>({
    id: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    assignee: '',
    dueDate: new Date(),
    relatedTicket: '',
  });

  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    type: 'general',
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

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      if (eventsError) console.error('Events error:', eventsError);
      if (eventsData) {
        setEventList(eventsData.map(event => ({
          ...event,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
        })));
      }

      // Tasks (sample)
      const sampleTasks: Task[] = [
        { id: '1', title: 'Server Maintenance', description: 'Perform routine server maintenance', priority: 'high', status: 'pending', assignee: 'John Doe', dueDate: new Date(), relatedTicket: 'TKT-001' },
        { id: '2', title: 'Update Documentation', description: 'Update user documentation', priority: 'medium', status: 'in_progress', assignee: 'Jane Smith', dueDate: new Date(Date.now() + 86400000), relatedTicket: 'TKT-002' },
      ];
      setTaskList(sampleTasks);

      // Reminders
      const { data: remindersData, error: remindersError } = await supabase
        .from('reminders')
        .select('*, profiles:assignee_id (full_name)')
        .order('due_date', { ascending: true });
      if (remindersError) console.error('Reminders error:', remindersError);
      if (remindersData) setReminderList(remindersData);

      // Profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });
      if (profilesError) console.error('Profiles error:', profilesError);
      if (profilesData) setProfiles(profilesData);

    } catch (error) {
      console.error('Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchData)
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  const visibleEvents = currentUser.role === 'technician'
    ? eventList.filter(e => e.assignee === currentUser.id)
    : eventList;

  const todayEvents = visibleEvents.filter(e => e.startTime.toDateString() === selectedDate.toDateString());
  const todayTasks = taskList.filter(t => new Date(t.dueDate).toDateString() === selectedDate.toDateString());
  const todayReminders = reminderList.filter(r => new Date(r.due_date).toDateString() === selectedDate.toDateString());

  // Color helpers
  const getEventTypeColor = (type: string) => {
    switch(type){
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_call': return 'bg-purple-100 text-purple-800 border-purple-200';
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
      case 'pending': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'in_progress': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch(type.toLowerCase()){
      case 'ticket_followup': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'meeting': return 'text-green-600 bg-green-100 border-green-200';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleAddTask = () => {
    const taskWithId = { ...newTask, id: Date.now().toString() };
    setTaskList([...taskList, taskWithId]);
    setShowCreateModal(false);
    setNewTask({ id: '', title: '', description: '', priority: 'medium', status: 'pending', assignee: '', dueDate: new Date(), relatedTicket: '' });
    addNotification('Task created successfully!');
  };

  const handleCompleteTask = (taskId: string) => {
    setTaskList(taskList.map(t => t.id === taskId ? {...t, status:'completed'} : t));
    addNotification('Task marked as completed!');
  };
  
  const handleDeleteTask = (taskId: string) => {
    setTaskList(taskList.filter(t => t.id !== taskId));
    addNotification('Task deleted successfully!');
  };

  const handleAddReminder = async () => {
    if(!newReminder.title.trim()) {
      addNotification('Please enter a title for the reminder', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{ ...newReminder, created_by: (await supabase.auth.getUser()).data.user?.id }])
        .select('*, profiles:assignee_id (full_name)');
        
      if(error) {
        console.error(error);
        addNotification('Failed to create reminder', 'error');
        return;
      }
      
      if(data?.length) {
        setReminderList(prev => [...prev, data[0]]);
        setShowCreateModal(false);
        setNewReminder({ title:'', description:'', type:'general', assignee_id:'', due_date: new Date().toISOString() });
        addNotification('Reminder created successfully!');
      }
    } catch(e) { 
      console.error(e);
      addNotification('Failed to create reminder', 'error');
    }
  };

  const handleCompleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').update({ is_completed: true }).eq('id', id);
    if(error) {
      console.error(error);
      addNotification('Failed to complete reminder', 'error');
      return;
    }
    setReminderList(prev => prev.map(r => r.id === id ? { ...r, is_completed: true } : r));
    addNotification('Reminder marked as completed!');
  };

  const handleDeleteReminder = async (id: string) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if(error) {
      console.error(error);
      addNotification('Failed to delete reminder', 'error');
      return;
    }
    setReminderList(prev => prev.filter(r => r.id !== id));
    addNotification('Reminder deleted successfully!');
  };

  const handleAddEvent = async () => {
    if(!newEvent.title?.trim()) {
      addNotification('Please enter a title for the event', 'error');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          ...newEvent, 
          created_by: (await supabase.auth.getUser()).data.user?.id 
        }])
        .select();
        
      if(error) {
        console.error(error);
        addNotification('Failed to create event', 'error');
        return;
      }
      
      if(data?.length) {
        setEventList(prev => [...prev, {
          ...data[0],
          startTime: new Date(data[0].start_time),
          endTime: new Date(data[0].end_time)
        }]);
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          type: 'meeting',
          start_time: new Date(),
          end_time: new Date(),
          location: '',
          assignee: '',
        });
        addNotification('Event created successfully!');
      }
    } catch(e) { 
      console.error(e);
      addNotification('Failed to create event', 'error');
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString(undefined, { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  const formatDateForInput = (dateString: string) => { const d = new Date(dateString); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0,16); };

  if(loading) return <div className="p-6 text-gray-600">Loading events...</div>;

  return (
    <div className="p-6">
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`flex items-center p-4 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${
              notification.type === 'success' 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-red-100 text-red-800 border-red-200'
            }`}
          >
            <Check className={`w-5 h-5 mr-2 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
            <span className="font-medium">{notification.message}</span>
            <button 
              onClick={() => removeNotification(notification.id)}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg border p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Scheduler</h2>
          <div className="flex space-x-2">
            {currentUser.role==='admin' && (
              <button 
                onClick={() => setShowCreateModal(true)} 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4"/> 
                <span>New Item</span>
              </button>
            )}
          </div>
        </div>

        {/* Calendar and Today's Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-1">
            <ReactCalendar
              value={selectedDate}
              onChange={date => setSelectedDate(date as Date)}
              tileContent={({ date }) => {
                const hasEvent = visibleEvents.some(e=>e.startTime.toDateString()===date.toDateString());
                const hasTask = taskList.some(t=>new Date(t.dueDate).toDateString()===date.toDateString());
                const hasReminder = reminderList.some(r=>new Date(r.due_date).toDateString()===date.toDateString());
                return (
                  <div className="flex justify-center space-x-1 mt-1">
                    {hasEvent && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                    {hasTask && <span className="w-2 h-2 bg-green-600 rounded-full"></span>}
                    {hasReminder && <span className="w-2 h-2 bg-purple-600 rounded-full"></span>}
                  </div>
                );
              }}
            />
          </div>

          {/* Today Lists */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Events */}
            <div className="rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold mb-3 flex items-center"><CalendarIcon className="w-4 h-4 mr-2"/>Today's Events</h4>
              {todayEvents.length>0 ? todayEvents.map(event=>(
                <div key={event.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>{event.type.replace('_',' ')}</span>
                    </div>
                    {currentUser.role==='admin' && <button className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4"/></button>}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-2"><Clock className="w-3 h-3 mr-1"/>{event.startTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} - {event.endTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</div>
                  {event.location && <div className="flex items-center text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 mr-1"/>{event.location}</div>}
                </div>
              )) : <p className="text-gray-500 text-sm">No events today</p>}
            </div>

            {/* Tasks */}
            <div className="rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold mb-3 flex items-center"><ListTodo className="w-4 h-4 mr-2"/>Today's Tasks</h4>
              {todayTasks.length>0 ? todayTasks.map(task=>(
                <div key={task.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="font-medium text-sm">{task.title}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                    </div>
                    <div className="flex space-x-1">
                      {task.status!=='completed' && <button onClick={()=>handleCompleteTask(task.id)} className="text-green-600 hover:text-green-800"><CheckCircle className="w-4 h-4"/></button>}
                      <button onClick={()=>handleDeleteTask(task.id)} className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Due: {task.dueDate.toLocaleDateString()}</div>
                </div>
              )) : <p className="text-gray-500 text-sm">No tasks today</p>}
            </div>

            {/* Reminders */}
            <div className="rounded-lg shadow-sm border p-4">
              <h4 className="font-semibold mb-3 flex items-center"><AlarmClock className="w-4 h-4 mr-2"/>Today's Reminders</h4>
              {todayReminders.length>0 ? todayReminders.map(reminder=>(
                <div key={reminder.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex justify-between">
                    <div>
                      <h5 className="font-medium text-sm">{reminder.title}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReminderTypeColor(reminder.type)}`}>{reminder.type}</span>
                      {reminder.profiles?.full_name && <div className="text-xs text-gray-500 mt-1">{reminder.profiles.full_name}</div>}
                    </div>
                    <div className="flex space-x-1">
                      {!reminder.is_completed && <button onClick={()=>handleCompleteReminder(reminder.id)} className="text-green-600 hover:text-green-800"><CheckCircle className="w-4 h-4"/></button>}
                      <button onClick={()=>handleDeleteReminder(reminder.id)} className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4"/></button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Due: {new Date(reminder.due_date).toLocaleString()}</div>
                </div>
              )) : <p className="text-gray-500 text-sm">No reminders today</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal - Improved with better sizing */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">
                {itemType === 'event' && 'Create New Event'}
                {itemType === 'task' && 'Create New Task'}
                {itemType === 'reminder' && 'Create New Reminder'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Type Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as 'event' | 'task' | 'reminder')}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="event">Event</option>
                  <option value="task">Task</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              {/* Common Fields */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={
                    itemType === 'event' ? newEvent.title || '' :
                    itemType === 'task' ? newTask.title :
                    newReminder.title
                  }
                  onChange={(e) => {
                    if (itemType === 'event') setNewEvent({...newEvent, title: e.target.value});
                    if (itemType === 'task') setNewTask({...newTask, title: e.target.value});
                    if (itemType === 'reminder') setNewReminder({...newReminder, title: e.target.value});
                  }}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter title"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={
                    itemType === 'event' ? newEvent.description || '' :
                    itemType === 'task' ? newTask.description :
                    newReminder.description
                  }
                  onChange={(e) => {
                    if (itemType === 'event') setNewEvent({...newEvent, description: e.target.value});
                    if (itemType === 'task') setNewTask({...newTask, description: e.target.value});
                    if (itemType === 'reminder') setNewReminder({...newReminder, description: e.target.value});
                  }}
                  className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter description"
                  rows={4}
                />
              </div>

              {/* Event Specific Fields */}
              {itemType === 'event' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value as any})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="meeting">Meeting</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="training">Training</option>
                      <option value="on_call">On Call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={newEvent.location || ''}
                      onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(newEvent.start_time?.toString() || new Date().toString())}
                      onChange={(e) => setNewEvent({...newEvent, start_time: new Date(e.target.value)})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="datetime-local"
                      value={formatDateForInput(newEvent.end_time?.toString() || new Date().toString())}
                      onChange={(e) => setNewEvent({...newEvent, end_time: new Date(e.target.value)})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <select
                      value={newEvent.assignee || ''}
                      onChange={(e) => setNewEvent({...newEvent, assignee: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select assignee</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Task Specific Fields */}
              {itemType === 'task' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newTask.status}
                      onChange={(e) => setNewTask({...newTask, status: e.target.value as any})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      value={formatDateForInput(newTask.dueDate.toString())}
                      onChange={(e) => setNewTask({...newTask, dueDate: new Date(e.target.value)})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Ticket</label>
                    <input
                      type="text"
                      value={newTask.relatedTicket}
                      onChange={(e) => setNewTask({...newTask, relatedTicket: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter related ticket"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <input
                      type="text"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter assignee"
                    />
                  </div>
                </div>
              )}

              {/* Reminder Specific Fields */}
              {itemType === 'reminder' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reminder Type</label>
                    <select
                      value={newReminder.type}
                      onChange={(e) => setNewReminder({...newReminder, type: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      onChange={(e) => setNewReminder({...newReminder, due_date: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <select
                      value={newReminder.assignee_id}
                      onChange={(e) => setNewReminder({...newReminder, assignee_id: e.target.value})}
                      className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select assignee</option>
                      {profiles.map(profile => (
                        <option key={profile.id} value={profile.id}>{profile.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 mr-3 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (itemType === 'event') handleAddEvent();
                  if (itemType === 'task') handleAddTask();
                  if (itemType === 'reminder') handleAddReminder();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;