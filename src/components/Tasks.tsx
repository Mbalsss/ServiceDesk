import React, { useState } from 'react';
import { CheckSquare, Plus, Clock, AlertTriangle, User, Search } from 'lucide-react';
import { Task } from '../types';

interface TasksProps {
  tasks: Task[];
}

const Tasks: React.FC<TasksProps> = ({ tasks }) => {
  const [taskList, setTaskList] = useState<Task[]>(tasks);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  // Filter tasks
  const filteredTasks = taskList.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Count tasks by status
  const pendingTasks = filteredTasks.filter(t => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  // Handlers
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

  const handleAddTask = () => {
    const taskWithId = { ...newTask, id: Date.now().toString() };
    setTaskList([...taskList, taskWithId]);
    setShowModal(false);
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

  // Helpers for colors
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tasks</h2>
          <p className="text-gray-600">Manage and track team tasks and assignments</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{pendingTasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-orange-600">{inProgressTasks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTasks.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-64">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTasks.map(task => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{task.title}</div>
                  <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap flex items-center">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-900">{task.assignee}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {task.dueDate.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {task.relatedTicket || <span className="text-gray-400">-</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                  <button
                    onClick={() => handleCompleteTask(task.id)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Mark as Completed"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Task"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">No tasks found matching your criteria.</div>
        )}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Assignee"
                value={newTask.assignee}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                value={newTask.dueDate.toISOString().substring(0,10)}
                onChange={(e) => setNewTask({ ...newTask, dueDate: new Date(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex mt-4 space-x-3">
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
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

export default Tasks;
