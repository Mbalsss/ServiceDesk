import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, MapPin, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScheduleEvent, User as AppUser } from '../types';
import TechnicianHeader from './technician/TechnicianHeader';

interface SchedulerProps {
  currentUser: AppUser;
  initialEvents?: ScheduleEvent[];
}

const Scheduler: React.FC<SchedulerProps> = ({ currentUser, initialEvents = [] }) => {
  const [eventList, setEventList] = useState<ScheduleEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
    title: '',
    description: '',
    type: 'meeting',
    start_time: new Date(),
    end_time: new Date(),
    location: '',
    assignee: '',
  });

  // Fetch events from Supabase
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      if (data) {
        const formattedEvents = data.map(event => ({
          ...event,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
        }));
        setEventList(formattedEvents);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Real-time updates
  useEffect(() => {
    const subscription = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => fetchEvents())
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  // Filter events for current user
  const visibleEvents = currentUser.role === 'technician'
    ? eventList.filter(e => e.assignee === currentUser.id)
    : eventList;

  // Events for the selected day
  const todayEvents = visibleEvents.filter(
    event => new Date(event.startTime).toDateString() === selectedDate.toDateString()
  );

  // Upcoming events
  const upcomingEvents = visibleEvents
    .filter(event => new Date(event.startTime) > new Date())
    .slice(0, 5);

  // Event type colors
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_call': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Add event
  const handleAddEvent = async () => {
    try {
      const { error } = await supabase.from('events').insert([{
        title: newEvent.title,
        description: newEvent.description,
        type: newEvent.type,
        start_time: newEvent.start_time?.toISOString(),
        end_time: newEvent.end_time?.toISOString(),
        location: newEvent.location,
        assignee: newEvent.assignee,
      }]);

      if (error) {
        console.error('Error adding event:', error);
        return;
      }

      setShowModal(false);
      setNewEvent({
        title: '',
        description: '',
        type: 'meeting',
        start_time: new Date(),
        end_time: new Date(),
        location: '',
        assignee: '',
      });

      fetchEvents();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) console.error('Error deleting event:', error);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Handle view change
  const handleViewChange = (mode: 'day' | 'week' | 'month') => {
    setViewMode(mode);
    if (mode === 'day') setSelectedDate(new Date()); // Reset to today
  };

  // Generate calendar dates based on view mode
  const generateCalendarDates = () => {
    const dates: Date[] = [];
    const start = new Date(selectedDate);

    if (viewMode === 'month') {
      start.setDate(1);
      const startDay = start.getDay();
      start.setDate(start.getDate() - startDay); // start from Sunday
      for (let i = 0; i < 42; i++) { // 6 weeks
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }
    } else if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay()); // Sunday of current week
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d);
      }
    } else {
      // Day view only shows selected date
      dates.push(new Date(selectedDate));
    }

    return dates;
  };

  const calendarDates = generateCalendarDates();

  if (loading) return <div className="p-6 text-gray-600">Loading events...</div>;

  return (
    <div>
      {/* Header */}
      <TechnicianHeader
        currentUser={currentUser}
        title={currentUser.role === 'admin' ? 'Administrator Scheduler' : 'My Schedule'}
        subtitle={currentUser.role === 'admin' 
          ? 'Manage all team schedules and assignments' 
          : 'View your upcoming assignments and schedule'}
      />

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg border p-6 space-y-6">

          {/* Main Content Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Scheduler</h2>
            {currentUser.role === 'admin' && (
              <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
                <Plus className="w-4 h-4" /> <span>New Event</span>
              </button>
            )}
          </div>

          {/* Calendar & Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-lg shadow-sm border p-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Calendar View</h3>
                <select 
                  value={viewMode} 
                  onChange={e => handleViewChange(e.target.value as any)} 
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>

              {/* Calendar Grid */}
              <div className={`grid ${viewMode === 'month' ? 'grid-cols-7 gap-2' : 'grid-cols-1 gap-2'}`}>
                {calendarDates.map((date, i) => {
                  const hasEvent = visibleEvents.some(e => new Date(e.startTime).toDateString() === date.toDateString());
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <div
                      key={i}
                      id={isSelected ? 'selected-day' : undefined}
                      onClick={() => setSelectedDate(date)}
                      className={`h-12 border rounded-lg flex items-center justify-center text-sm cursor-pointer
                        ${hasEvent ? 'bg-blue-50 border-blue-200' : ''}
                        ${isSelected ? 'bg-blue-200 font-semibold' : ''}`}
                    >
                      {viewMode !== 'day' ? date.getDate() : date.toDateString()}
                      {hasEvent && viewMode !== 'day' && <div className="w-2 h-2 bg-blue-600 rounded-full ml-1"></div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Today's Events */}
            <div className="space-y-6">
              <div className="rounded-lg shadow-sm border p-4">
                <h4 className="font-semibold mb-3 flex items-center"><Clock className="w-4 h-4 mr-2"/>Today's Events</h4>
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
                        <button onClick={() => handleDeleteEvent(event.id)} className="text-red-600 hover:text-red-800">
                          <Trash className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3 mr-1"/>
                      {new Date(event.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                      {new Date(event.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    {event.location && <div className="flex items-center text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 mr-1"/>{event.location}</div>}
                  </div>
                )) : <p className="text-gray-500 text-sm">No events for today</p>}
              </div>
            </div>
          </div>
        </div>

        {/* New Event Modal */}
        {showModal && currentUser.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
              <input type="text" placeholder="Title" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2"/>
              <textarea placeholder="Description" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2"/>
              <input type="text" placeholder="Assignee" value={newEvent.assignee} onChange={e => setNewEvent({...newEvent, assignee: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2"/>
              <input type="text" placeholder="Location" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full px-3 py-2 border rounded-lg mb-2"/>
              <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as any})} className="w-full px-3 py-2 border rounded-lg mb-2">
                <option value="maintenance">Maintenance</option>
                <option value="meeting">Meeting</option>
                <option value="training">Training</option>
                <option value="on_call">On Call</option>
              </select>
              <div className="flex gap-2 mb-2">
                <input type="datetime-local" value={newEvent.start_time?.toISOString().slice(0,16)} onChange={e => setNewEvent({...newEvent, start_time: new Date(e.target.value)})} className="w-1/2 px-3 py-2 border rounded-lg"/>
                <input type="datetime-local" value={newEvent.end_time?.toISOString().slice(0,16)} onChange={e => setNewEvent({...newEvent, end_time: new Date(e.target.value)})} className="w-1/2 px-3 py-2 border rounded-lg"/>
              </div>
              <div className="flex space-x-3">
                <button onClick={handleAddEvent} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Event</button>
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Scheduler;
