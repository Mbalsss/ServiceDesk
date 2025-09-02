import React from 'react';
import { ArrowLeft, MessageSquare, Clock, User, Tag, AlertTriangle, Edit, UserPlus, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Ticket } from '../types';

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
  onAssign?: (ticketId: string, assignee: string) => void;
  onStatusChange?: (ticketId: string, status: string) => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, onBack, onAssign, onStatusChange }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'in_progress': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'resolved': return 'text-green-600 bg-green-100 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-100 border-gray-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'take':
        onAssign?.(ticket.id, 'Current User');
        break;
      case 'resolve':
        onStatusChange?.(ticket.id, 'resolved');
        break;
      case 'close':
        onStatusChange?.(ticket.id, 'closed');
        break;
      case 'reopen':
        onStatusChange?.(ticket.id, 'open');
        break;
    }
  };
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.id}</h1>
            <p className="text-gray-600 mt-1">{ticket.title}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleQuickAction('take')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Take</span>
            </button>
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <button 
                onClick={() => handleQuickAction('resolve')}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Resolve</span>
              </button>
            )}
            {ticket.status === 'resolved' && (
              <button 
                onClick={() => handleQuickAction('close')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Close</span>
              </button>
            )}
            {(ticket.status === 'resolved' || ticket.status === 'closed') && (
              <button 
                onClick={() => handleQuickAction('reopen')}
                className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reopen</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Microsoft Adaptive Cards Section */}
      <div className="mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Microsoft Adaptive Card Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-sm font-medium text-blue-900">Assign to Me</div>
              <div className="text-xs text-blue-600">Quick assignment</div>
            </button>
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-sm font-medium text-blue-900">Update Status</div>
              <div className="text-xs text-blue-600">Change ticket status</div>
            </button>
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-sm font-medium text-blue-900">Add Comment</div>
              <div className="text-xs text-blue-600">Post update</div>
            </button>
            <button className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              <div className="text-sm font-medium text-blue-900">Escalate</div>
              <div className="text-xs text-blue-600">Escalate to manager</div>
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{ticket.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <p className="text-gray-900">{ticket.category}</p>
                </div>
                {ticket.subcategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
                    <p className="text-gray-900">{ticket.subcategory}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Updates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Real-time Updates</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Status updated to In Progress</p>
                  <p className="text-sm text-green-700 mt-1">Ticket assigned to {ticket.assignee}</p>
                  <p className="text-xs text-green-600 mt-1">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Teams notification sent</p>
                  <p className="text-sm text-blue-700 mt-1">Requester notified via Microsoft Teams</p>
                  <p className="text-xs text-blue-600 mt-1">5 minutes ago</p>
                </div>
              </div>
            </div>
          </div>
          {/* Microsoft Teams Integration */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Microsoft Teams Chat</h3>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-700 text-sm">This ticket has been synchronized with Microsoft Teams. All updates and communications are available in the dedicated Teams channel.</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.requester}</p>
                  <p className="text-sm text-gray-600 mt-1">Initial request submitted via Teams integration</p>
                  <p className="text-xs text-gray-500 mt-1">{ticket.createdAt.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{ticket.assignee}</p>
                  <p className="text-sm text-gray-600 mt-1">Ticket assigned and investigation started</p>
                  <p className="text-xs text-gray-500 mt-1">{ticket.updatedAt.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Open in Microsoft Teams</span>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Status & Priority</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Priority</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium capitalize">
                  {ticket.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Assignment</h4>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600 block">Assignee</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{ticket.assignee}</span>
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600 block">Requester</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{ticket.requester}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <UserPlus className="w-4 h-4" />
                <span>Reassign Ticket</span>
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Timeline</h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 block">Created</span>
                  <span className="text-sm font-medium text-gray-900">{ticket.createdAt.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <div>
                  <span className="text-sm text-gray-600 block">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">{ticket.updatedAt.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copilot Suggestions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
              Copilot Suggestions
            </h4>
            
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900 font-medium">Suggested Resolution</p>
                <p className="text-sm text-blue-700 mt-1">Based on similar tickets, try restarting the email client and clearing cache.</p>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900 font-medium">Knowledge Base Match</p>
                <p className="text-sm text-green-700 mt-1">Found 3 related articles in the knowledge base.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetails;