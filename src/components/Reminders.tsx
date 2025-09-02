import React, { useState } from 'react';
import { Clock, Plus, Bell, CheckCircle, AlertTriangle, Calendar, User } from 'lucide-react';
import { Reminder } from '../types';

interface RemindersProps {
  reminders: Reminder[];
}

const Reminders: React.FC<RemindersProps> = ({ reminders }) => {
  const [reminderList, setReminderList] = useState<Reminder[]>(reminders);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [newReminder, setNewReminder] = useState<Reminder>({
    id: '',
    title: '',
    description: '',
    type: 'general',
    assignee: '',
    dueDate: new Date(),
    isCompleted: false,
  });

  const filteredReminders = reminderList.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !reminder.isCompleted;
    if (filter === 'completed') return reminder.isCompleted;
    if (filter === 'overdue') return !reminder.isCompleted && new Date(reminder.dueDate) < new Date();
    return reminder.type === filter;
  });

  const pendingReminders = reminderList.filter(r => !r.isCompleted);
  const overdueReminders = reminderList.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date());
  const completedReminders = reminderList.filter(r => r.isCompleted);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ticket_followup': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'maintenance': return 'text-red-600 bg-red-100 border-red-200';
      case 'meeting': return 'text-green-600 bg-green-100 border-green-200';
      case 'general': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket_followup': return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'general': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: Date, isCompleted: boolean) => {
    return !isCompleted && new Date(dueDate) < new Date();
  };

  const handleCompleteReminder = (id: string) => {
    setReminderList(reminderList.map(r => r.id === id ? { ...r, isCompleted: true } : r));
  };

  const handleDeleteReminder = (id: string) => {
    setReminderList(reminderList.filter(r => r.id !== id));
  };

  const handleAddReminder = () => {
    setReminderList([...reminderList, { ...newReminder, id: Date.now().toString() }]);
    setShowModal(false);
    setNewReminder({
      id: '',
      title: '',
      description: '',
      type: 'general',
      assignee: '',
      dueDate: new Date(),
      isCompleted: false,
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reminders</h2>
          <p className="text-gray-600">Stay on top of important tasks and follow-ups</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
          <div className="bg-blue-100 p-3 rounded-lg"><Clock className="w-6 h-6 text-blue-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-blue-600">{pendingReminders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
          <div className="bg-red-100 p-3 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{overdueReminders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center">
          <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="w-6 h-6 text-green-600" /></div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedReminders.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-2">
        {['all','pending','overdue','completed','ticket_followup','maintenance','meeting','general'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter===f?'bg-blue-100 text-blue-700 border border-blue-200':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.replace('_',' ')}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.map(r => (
          <div key={r.id} className={`bg-white rounded-lg shadow-sm border p-4 flex justify-between ${isOverdue(r.dueDate, r.isCompleted)?'border-red-200 bg-red-50': r.isCompleted?'border-green-200 bg-green-50':'border-gray-200'}`}>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg border ${getTypeColor(r.type)}`}>{getTypeIcon(r.type)}</div>
                <div>
                  <h3 className={`font-medium ${r.isCompleted?'text-gray-500 line-through':'text-gray-900'}`}>{r.title}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(r.type)}`}>{r.type.replace('_',' ')}</span>
                </div>
              </div>
              <p className={`text-sm mb-3 ${r.isCompleted?'text-gray-400':'text-gray-600'}`}>{r.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center"><Calendar className="w-4 h-4 mr-1" /><span className={isOverdue(r.dueDate,r.isCompleted)?'text-red-600 font-medium':''}>Due: {r.dueDate.toLocaleString()}</span></div>
                <div className="flex items-center"><User className="w-4 h-4 mr-1" /><span>{r.assignee}</span></div>
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              {!r.isCompleted && <button onClick={()=>handleCompleteReminder(r.id)} className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"><CheckCircle className="w-5 h-5"/></button>}
              {r.isCompleted && <div className="flex items-center text-green-600"><CheckCircle className="w-4 h-4 mr-1"/><span className="text-xs font-medium">COMPLETED</span></div>}
              {isOverdue(r.dueDate,r.isCompleted) && <div className="flex items-center text-red-600"><AlertTriangle className="w-4 h-4 mr-1"/><span className="text-xs font-medium">OVERDUE</span></div>}
              <button onClick={()=>handleDeleteReminder(r.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><AlertTriangle className="w-4 h-4"/></button>
            </div>
          </div>
        ))}
        {filteredReminders.length===0 && <div className="text-center py-12"><Bell className="w-12 h-12 text-gray-400 mx-auto mb-4"/><p className="text-gray-500">No reminders found matching your criteria.</p></div>}
      </div>

      {/* New Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Reminder</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Title" value={newReminder.title} onChange={e=>setNewReminder({...newReminder,title:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="text" placeholder="Description" value={newReminder.description} onChange={e=>setNewReminder({...newReminder,description:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="text" placeholder="Assignee" value={newReminder.assignee} onChange={e=>setNewReminder({...newReminder,assignee:e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
              <input type="datetime-local" value={newReminder.dueDate.toISOString().slice(0,16)} onChange={e=>setNewReminder({...newReminder,dueDate:new Date(e.target.value)})} className="w-full px-3 py-2 border rounded-lg"/>
              <select value={newReminder.type} onChange={e=>setNewReminder({...newReminder,type:e.target.value as any})} className="w-full px-3 py-2 border rounded-lg">
                <option value="ticket_followup">Ticket Follow-up</option>
                <option value="maintenance">Maintenance</option>
                <option value="meeting">Meeting</option>
                <option value="general">General</option>
              </select>
            </div>
            <div className="flex mt-4 space-x-3">
              <button onClick={handleAddReminder} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">Add Reminder</button>
              <button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
