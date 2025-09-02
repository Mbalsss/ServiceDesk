import React, { useState } from 'react';
import { Calendar, Clock, Plus, MapPin, User, Filter, Trash } from 'lucide-react';
import { ScheduleEvent } from '../types';

interface SchedulerProps {
  events: ScheduleEvent[];
}

const Scheduler: React.FC<SchedulerProps> = ({ events }) => {
  const [eventList, setEventList] = useState<ScheduleEvent[]>(events);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState<ScheduleEvent>({
    id: '',
    title: '',
    description: '',
    type: 'meeting',
    startTime: new Date(),
    endTime: new Date(),
    location: '',
    assignee: '',
  });

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_call': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const todayEvents = eventList.filter(event => new Date(event.startTime).toDateString() === selectedDate.toDateString());
  const upcomingEvents = eventList.filter(event => new Date(event.startTime) > new Date()).slice(0, 5);

  const handleAddEvent = () => {
    setEventList([...eventList, { ...newEvent, id: Date.now().toString() }]);
    setShowModal(false);
    setNewEvent({
      id: '',
      title: '',
      description: '',
      type: 'meeting',
      startTime: new Date(),
      endTime: new Date(),
      location: '',
      assignee: '',
    });
  };

  const handleDeleteEvent = (id: string) => {
    setEventList(eventList.filter(e => e.id !== id));
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Scheduler</h2>
          <p className="text-gray-600">Manage maintenance, meetings, and on-call schedules</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Calendar View</h3>
            <div className="flex items-center space-x-2">
              <select value={viewMode} onChange={e => setViewMode(e.target.value as any)} className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const hasEvent = eventList.some(event => new Date(event.startTime).toDateString() === date.toDateString());
              return (
                <div key={i} onClick={() => setSelectedDate(date)}
                  className={`h-12 border border-gray-200 rounded-lg flex items-center justify-center text-sm cursor-pointer hover:bg-gray-50 ${
                    hasEvent ? 'bg-blue-50 border-blue-200' : ''
                  }`}>
                  {date.getDate()}
                  {hasEvent && <div className="w-2 h-2 bg-blue-600 rounded-full ml-1"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Today's Events */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center"><Clock className="w-4 h-4 mr-2"/>Today's Events</h4>
            {todayEvents.length > 0 ? (
              <div className="space-y-3">
                {todayEvents.map(event => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 text-sm">{event.title}</h5>
                        <p className="text-xs text-gray-600">{event.description}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>{event.type.replace('_',' ')}</span>
                      </div>
                      <button onClick={() => handleDeleteEvent(event.id)} className="text-red-600 hover:text-red-800"><Trash className="w-4 h-4"/></button>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="w-3 h-3 mr-1"/>
                      {new Date(event.startTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} - 
                      {new Date(event.endTime).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                    </div>
                    {event.location && <div className="flex items-center text-xs text-gray-500 mt-1"><MapPin className="w-3 h-3 mr-1"/>{event.location}</div>}
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-sm">No events for today</p>)}
          
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center"><Calendar className="w-4 h-4 mr-2"/>Upcoming Events</h4>
            <div className="space-y-3">
              {upcomingEvents.map(event => (
                <div key={event.id} className="p-3 border border-gray-200 rounded-lg">
                  <h5 className="font-medium text-gray-900 text-sm">{event.title}</h5>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>{event.type.replace('_',' ')}</span>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Calendar className="w-3 h-3 mr-1"/>{new Date(event.startTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <User className="w-3 h-3 mr-1"/>{event.assignee}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <textarea placeholder="Description" value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="text" placeholder="Assignee" value={newEvent.assignee} onChange={e=>setNewEvent({...newEvent,assignee:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="text" placeholder="Location" value={newEvent.location} onChange={e=>setNewEvent({...newEvent,location:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <select value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="maintenance">Maintenance</option>
                <option value="meeting">Meeting</option>
                <option value="training">Training</option>
                <option value="on_call">On Call</option>
              </select>
              <div className="flex gap-2">
                <input type="datetime-local" value={newEvent.startTime.toISOString().slice(0,16)} onChange={e=>setNewEvent({...newEvent,startTime:new Date(e.target.value)})} className="w-1/2 px-3 py-2 border rounded-lg"/>
                <input type="datetime-local" value={newEvent.endTime.toISOString().slice(0,16)} onChange={e=>setNewEvent({...newEvent,endTime:new Date(e.target.value)})} className="w-1/2 px-3 py-2 border rounded-lg"/>
              </div>
            </div>
            <div className="flex mt-4 space-x-3">
              <button onClick={handleAddEvent} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Event</button>
              <button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduler;
