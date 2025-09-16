import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, MapPin, Trash, CheckSquare, Bell, CheckCircle, 
  AlertTriangle, Calendar, User, X, Trash2, Filter, Loader, Search 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScheduleEvent, User as AppUser, Task, Reminder } from '../types';

interface SchedulerProps {
  currentUser: AppUser;
  initialEvents?: ScheduleEvent[];
}

const Scheduler: React.FC<SchedulerProps> = ({ currentUser, initialEvents = [] }) => {
  const [eventList, setEventList] = useState<ScheduleEvent[]>(initialEvents);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [reminderList, setReminderList] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<{id: string, full_name: string}[]>([]);
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

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (eventsError) console.error('Error fetching events:', eventsError);
      if (eventsData) {
        setEventList(
          eventsData.map(event => ({
            ...event,
            startTime: new Date(event.start_time),
            endTime: new Date(event.end_time),
          }))
        );
      }

      // Fetch tasks (simulated as we don't have a tasks table)
      // In a real implementation, you would fetch from a tasks table
      const sampleTasks: Task[] = [
        {
          id: '1',
          title: 'Server Maintenance',
          description: 'Perform routine server maintenance',
          priority: 'high',
          status: 'pending',
          assignee: 'John Doe',
          dueDate: new Date(),
          relatedTicket: 'TKT-001',
        },
        {
          id: '2',
          title: 'Update Documentation',
          description: 'Update user documentation for new features',
          priority: 'medium',
          status: 'in_progress',
          assignee: 'Jane Smith',
          dueDate: new Date(Date.now() + 86400000),
          relatedTicket: 'TKT-002',
        },
      ];
      setTaskList(sampleTasks);

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
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchData())
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  const visibleEvents = currentUser.role === 'technician'
    ? eventList.filter(e => e.assignee === currentUser.id)
    : eventList;

  const todayEvents = visibleEvents.filter(
    e => e.startTime.toDateString() === selectedDate.toDateString()
  );

  const todayTasks = taskList.filter(
    t => new Date(t.dueDate).toDateString() === selectedDate.toDateString()
  );

  const todayReminders = reminderList.filter(
    r => new Date(r.due_date).toDateString() === selectedDate.toDateString()
  );

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const staffList = Array.from(new Set(visibleEvents.map(e => e.assignee || 'Unassigned')));

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_call': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'in_progress': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ticket_followup': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'meeting': return 'text-green-600 bg-green-100 border-green-200';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const generateCalendarDates = () => {
    const dates: Date[] = [];
    const today = new Date(selectedDate);

    if (viewMode === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDay = firstOfMonth.getDay();
      const startDate = new Date(firstOfMonth);
      startDate.setDate(firstOfMonth.getDate() - startDay);

      for (let i = 0; i < 42; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        dates.push(d);
      }
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        dates.push(d);
      }
    } else {
      dates.push(today);
    }

    return dates;
  };

  const calendarDates = generateCalendarDates();

  const handleAddTask = () => {
    const taskWithId = { ...newTask, id: Date.now().toString() };
    setTaskList([...taskList, taskWithId]);
    setShowTaskModal(false);
    setNewTask({
      id: '',
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      assignee: '',
      dueDate: new Date(),
      relatedTicket: '',
    });
  };

  const handleCompleteTask = (taskId: string) => {
    const updated = taskList.map(t =>
      t.id === taskId ? { ...t, status: 'completed' } : t
    );
    setTaskList(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = taskList.filter(t => t.id !== taskId);
    setTaskList(updated);
  };

  const handleAddReminder = async () => {
    if (!newReminder.title.trim()) {
      alert('Please Enter A Title For The Reminder');
      return;
    }
    
    try {
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
        console.error('Error Adding Reminder:', error);
        return;
      }

      if (data && data.length > 0) {
        setReminderList(prev => [...prev, data[0]]);
        setShowReminderModal(false);
        setNewReminder({
          title: '',
          description: '',
          type: 'general',
          assignee_id: '',
          due_date: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed To Add Reminder:', error);
    }
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_completed: true })
        .eq('id', id);

      if (error) {
        console.error('Error Completing Reminder:', error);
        return;
      }

      setReminderList(prev => 
        prev.map(r => r.id === id ? { ...r, is_completed: true } : r)
      );
    } catch (error) {
      console.error('Failed To Complete Reminder:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error Deleting Reminder:', error);
        return;
      }

      setReminderList(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed To Delete Reminder:', error);
    }
  };

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

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  if (loading) return <div className="p-6 text-gray-600">Loading events...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg border p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Scheduler</h2>
          <div className="flex space-x-2">
            {currentUser.role === 'admin' && (
              <>
                <button onClick={() => setShowEventModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                  <Plus className="w-4 h-4" /> <span>New Event</span>
                </button>
                <button onClick={() => setShowTaskModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg">
                  <CheckSquare className="w-4 h-4" /> <span>New Task</span>
                </button>
                <button onClick={() => setShowReminderModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
                  <Bell className="w-4 h-4" /> <span>New Reminder</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleString('default', { month: 'long' })} {selectedDate.getFullYear()}
          </h3>
          <select value={viewMode} onChange={e => setViewMode(e.target.value as any)} className="px-3 py-1 border rounded-md text-sm">
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>

        {/* Calendar Grid */}
        <div className={`grid ${viewMode === 'month' ? 'grid-cols-7 gap-2' : 'grid-cols-1 gap-2'}`}>
          {/* Weekday headers for month/week */}
          {(viewMode === 'month' || viewMode === 'week') && (
            <div className={`grid ${viewMode === 'month' ? 'grid-cols-7' : 'grid-cols-7'} gap-2 mb-1 text-center font-semibold text-gray-600`}>
              {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
          )}

          {/* Staff + dates (week view) */}
          {viewMode === 'week' && staffList.map(staff => (
            <React.Fragment key={staff}>
              <div className="font-medium">{staff}</div>
              {calendarDates.map(date => (
                <div key={date.toDateString() + staff} className="h-10 border flex items-center justify-center">
                  {visibleEvents.some(e => e.assignee === staff && e.startTime.toDateString() === date.toDateString()) && (
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Month/day view cells */}
          {(viewMode === 'month' || viewMode === 'day') && calendarDates.map((date, i) => {
            const hasEvent = visibleEvents.some(e => e.startTime.toDateString() === date.toDateString());
            const hasTask = taskList.some(t => new Date(t.dueDate).toDateString() === date.toDateString());
            const hasReminder = reminderList.some(r => new Date(r.due_date).toDateString() === date.toDateString());
            const isSelected = date.toDateString() === selectedDate.toDateString();
            
            return (
              <div
                key={i}
                onClick={() => setSelectedDate(date)}
                className={`h-12 border rounded-lg flex items-center justify-center text-sm cursor-pointer relative
                  ${hasEvent ? 'bg-blue-50 border-blue-200' : ''}
                  ${hasTask ? 'bg-green-50 border-green-200' : ''}
                  ${hasReminder ? 'bg-purple-50 border-purple-200' : ''}
                  ${isSelected ? 'bg-blue-200 font-semibold' : ''}`}
              >
                {viewMode !== 'day' ? date.getDate() : date.toDateString()}
                <div className="absolute bottom-1 flex space-x-1">
                  {hasEvent && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                  {hasTask && <div className="w-2 h-2 bg-green-600 rounded-full"></div>}
                  {hasReminder && <div className="w-2 h-2 bg-purple-600 rounded-full"></div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Today's Events, Tasks, and Reminders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Events */}
          <div className="rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2"/>Today's Events</h4>
            {todayEvents.length > 0 ? todayEvents.map(event => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between">
                  <div>
                    <h5 className="font-medium text-sm">{event.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                      {event.type.replace('_', ' ')}
                    </span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <button className="text-red-600 hover:text-red-800">
                      <Trash className="w-4 h-4"/>
                    </button>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Clock className="w-3 h-3 mr-1"/>
                  {event.startTime.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })} - 
                  {event.endTime.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                </div>
                {event.location && <div className="flex items-center text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 mr-1"/>{event.location}</div>}
              </div>
            )) : <p className="text-gray-500 text-sm">No events for today</p>}
          </div>

          {/* Tasks */}
          <div className="rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold mb-3 flex items-center"><CheckSquare className="w-4 h-4 mr-2"/>Today's Tasks</h4>
            {todayTasks.length > 0 ? todayTasks.map(task => (
              <div key={task.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between">
                  <div>
                    <h5 className="font-medium text-sm">{task.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <div className="flex space-x-1">
                      <button onClick={() => handleCompleteTask(task.id)} className="text-green-600 hover:text-green-800">
                        <CheckCircle className="w-4 h-4"/>
                      </button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-red-600 hover:text-red-800">
                        <Trash className="w-4 h-4"/>
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">{task.description}</div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <User className="w-3 h-3 mr-1"/>
                  {task.assignee}
                </div>
              </div>
            )) : <p className="text-gray-500 text-sm">No tasks for today</p>}
          </div>

          {/* Reminders */}
          <div className="rounded-lg shadow-sm border p-4">
            <h4 className="font-semibold mb-3 flex items-center"><Bell className="w-4 h-4 mr-2"/>Today's Reminders</h4>
            {todayReminders.length > 0 ? todayReminders.map(reminder => (
              <div key={reminder.id} className="p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between">
                  <div>
                    <h5 className="font-medium text-sm">{reminder.title}</h5>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getReminderTypeColor(reminder.type)}`}>
                      {reminder.type.replace('_', ' ')}
                    </span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <div className="flex space-x-1">
                      {!reminder.is_completed && (
                        <button onClick={() => handleCompleteReminder(reminder.id)} className="text-green-600 hover:text-green-800">
                          <CheckCircle className="w-4 h-4"/>
                        </button>
                      )}
                      <button onClick={() => handleDeleteReminder(reminder.id)} className="text-red-600 hover:text-red-800">
                        <Trash className="w-4 h-4"/>
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2">{reminder.description}</div>
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Clock className="w-3 h-3 mr-1"/>
                  Due: {formatDate(reminder.due_date)}
                </div>
                {reminder.profiles && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <User className="w-3 h-3 mr-1"/>
                    {reminder.profiles.full_name}
                  </div>
                )}
              </div>
            )) : <p className="text-gray-500 text-sm">No reminders for today</p>}
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setShowEventModal(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Event</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Event Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Event Description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  value={newEvent.type}
                  onChange={e => setNewEvent({...newEvent, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="meeting">Meeting</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="training">Training</option>
                  <option value="on_call">On Call</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input 
                  type="datetime-local"
                  value={newEvent.start_time?.toISOString().slice(0, 16)}
                  onChange={e => setNewEvent({...newEvent, start_time: new Date(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time</label>
                <input 
                  type="datetime-local"
                  value={newEvent.end_time?.toISOString().slice(0, 16)}
                  onChange={e => setNewEvent({...newEvent, end_time: new Date(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  type="text"
                  value={newEvent.location}
                  onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <select 
                  value={newEvent.assignee}
                  onChange={e => setNewEvent({...newEvent, assignee: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select Assignee</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setShowTaskModal(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Task Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Task Description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select 
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <input 
                  type="text"
                  value={newTask.assignee}
                  onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Assignee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input 
                  type="date"
                  value={newTask.dueDate.toISOString().substring(0,10)}
                  onChange={e => setNewTask({...newTask, dueDate: new Date(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Related Ticket</label>
                <input 
                  type="text"
                  value={newTask.relatedTicket}
                  onChange={e => setNewTask({...newTask, relatedTicket: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Related Ticket"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleAddTask} className="px-4 py-2 bg-green-600 text-white rounded-lg">
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setShowReminderModal(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold mb-4">Add New Reminder</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  type="text"
                  value={newReminder.title}
                  onChange={e => setNewReminder({...newReminder, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Reminder Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={newReminder.description}
                  onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="Enter Reminder Description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select 
                  value={newReminder.type}
                  onChange={e => setNewReminder({...newReminder, type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="general">General</option>
                  <option value="ticket_followup">Ticket Followup</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Assignee</label>
                <select 
                  value={newReminder.assignee_id}
                  onChange={e => setNewReminder({...newReminder, assignee_id: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select Assignee</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input 
                  type="datetime-local"
                  value={formatDateForInput(newReminder.due_date)}
                  onChange={e => setNewReminder({...newReminder, due_date: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={handleAddReminder} className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                  Add Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;