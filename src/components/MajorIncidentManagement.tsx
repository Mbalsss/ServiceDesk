import React, { useState, useEffect } from 'react';
import { AlertTriangle, Users, MessageSquare, Clock, CheckCircle, Plus, Filter, ExternalLink, Bell } from 'lucide-react';
import { MajorIncident } from '../types';

const STATUS_OPTIONS = ['active', 'investigating', 'identified', 'monitoring', 'resolved'];
const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];

const MajorIncidentManagement: React.FC = () => {
  const [incidents, setIncidents] = useState<MajorIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<MajorIncident | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Load from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('majorIncidents');
    if (stored) setIncidents(JSON.parse(stored));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('majorIncidents', JSON.stringify(incidents));
  }, [incidents]);

  // Declare new incident
  const declareIncident = () => {
    const newIncident: MajorIncident = {
      id: `MI-${Date.now()}`,
      title: 'New Major Incident',
      description: 'Description of the incident',
      status: 'active',
      severity: 'high',
      impactedUsers: 0,
      incidentCommander: 'TBD',
      communicationChannel: 'Teams',
      estimatedResolution: null,
      affectedServices: [],
      workarounds: [],
      updates: [],
      startTime: new Date(),
    };
    setIncidents([newIncident, ...incidents]);
    setSelectedIncident(newIncident);
  };

  // Update fields dynamically
  const updateIncidentField = (id: string, field: keyof MajorIncident, value: any) => {
    setIncidents(prev =>
      prev.map(inc => (inc.id === id ? { ...inc, [field]: value } : inc))
    );
  };

  const addIncidentUpdate = (id: string, updateContent: string, author: string) => {
    setIncidents(prev =>
      prev.map(inc =>
        inc.id === id
          ? {
              ...inc,
              updates: [
                { id: `${Date.now()}`, content: updateContent, author, timestamp: new Date() },
                ...inc.updates,
              ],
            }
          : inc
      )
    );
  };

  // Filtering and computations
  const filteredIncidents = incidents.filter(incident => statusFilter === 'all' ? true : incident.status === statusFilter);
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const criticalIncidents = incidents.filter(i => i.severity === 'critical');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved');
  const totalImpactedUsers = incidents.reduce((sum, inc) => sum + inc.impactedUsers, 0);
  const today = new Date();
  const resolvedToday = resolvedIncidents.filter(i => {
    if (!i.estimatedResolution) return false;
    return new Date(i.estimatedResolution).toDateString() === today.toDateString();
  }).length;

  const avgResolutionTime =
    resolvedIncidents.length > 0
      ? resolvedIncidents.reduce((sum, inc) => {
          const start = new Date(inc.startTime).getTime();
          const end = inc.estimatedResolution ? new Date(inc.estimatedResolution).getTime() : Date.now();
          return sum + (end - start);
        }, 0) / resolvedIncidents.length / 1000 / 60 / 60
      : 0;

  // Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100 border-red-200';
      case 'investigating': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'identified': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'monitoring': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'resolved': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Major Incident Management</h2>
          <p className="text-gray-600">Coordinate and manage critical incidents affecting business operations</p>
        </div>
        <button
          onClick={declareIncident}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Declare Major Incident</span>
        </button>
      </div>

      {/* Critical Banner */}
      {criticalIncidents.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Critical Incidents Active</h3>
              <p className="text-red-700 text-sm">{criticalIncidents.length} critical incident(s) requiring immediate attention</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div onClick={() => setStatusFilter('active')} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Incidents</p>
              <p className="text-2xl font-bold text-red-600">{activeIncidents.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Resolution Time (h)</p>
              <p className="text-2xl font-bold text-orange-600">{avgResolutionTime.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Impacted Users</p>
              <p className="text-2xl font-bold text-blue-600">{totalImpactedUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved Today</p>
              <p className="text-2xl font-bold text-green-600">{resolvedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center space-x-4">
        <Filter className="w-5 h-5 text-gray-600" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="all">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Incident List & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Major Incidents</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredIncidents.map(incident => (
                <div
                  key={incident.id}
                  className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedIncident?.id === incident.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{incident.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{incident.id}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        value={incident.severity}
                        onChange={(e) => updateIncidentField(incident.id, 'severity', e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}
                      >
                        {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <select
                        value={incident.status}
                        onChange={(e) => updateIncidentField(incident.id, 'status', e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(incident.status)}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{incident.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <input type="number" value={incident.impactedUsers} onChange={e => updateIncidentField(incident.id, 'impactedUsers', Number(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm" />
                      <span className="ml-1">users</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Started {new Date(incident.startTime).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {selectedIncident ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Incident Details</h4>
              <p><strong>Commander:</strong> <input value={selectedIncident.incidentCommander} onChange={e => updateIncidentField(selectedIncident.id, 'incidentCommander', e.target.value)} className="border px-2 py-1 rounded w-full text-sm"/></p>
              <p><strong>Channel:</strong> <input value={selectedIncident.communicationChannel} onChange={e => updateIncidentField(selectedIncident.id, 'communicationChannel', e.target.value)} className="border px-2 py-1 rounded w-full text-sm"/></p>
              <p><strong>Estimated Resolution:</strong> <input type="datetime-local" value={selectedIncident.estimatedResolution ? new Date(selectedIncident.estimatedResolution).toISOString().slice(0,16) : ''} onChange={e => updateIncidentField(selectedIncident.id, 'estimatedResolution', new Date(e.target.value).toISOString())} className="border px-2 py-1 rounded w-full text-sm"/></p>

              {/* Affected Services */}
              <div className="mt-4">
                <h5 className="font-semibold">Affected Services</h5>
                {selectedIncident.affectedServices.map((s, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mt-1">
                    <input value={s} onChange={e => {
                      const arr = [...selectedIncident.affectedServices];
                      arr[idx] = e.target.value;
                      updateIncidentField(selectedIncident.id, 'affectedServices', arr);
                    }} className="border px-2 py-1 rounded w-full text-sm"/>
                    <button onClick={() => {
                      const arr = selectedIncident.affectedServices.filter((_, i) => i !== idx);
                      updateIncidentField(selectedIncident.id, 'affectedServices', arr);
                    }} className="text-red-600 font-bold">X</button>
                  </div>
                ))}
                <button onClick={() => updateIncidentField(selectedIncident.id, 'affectedServices', [...selectedIncident.affectedServices, 'New Service'])} className="mt-2 px-2 py-1 bg-blue-600 text-white rounded text-sm">Add Service</button>
              </div>

              {/* Workarounds */}
              <div className="mt-4">
                <h5 className="font-semibold">Workarounds</h5>
                {selectedIncident.workarounds.map((w, idx) => (
                  <div key={idx} className="flex items-center space-x-2 mt-1">
                    <input value={w} onChange={e => {
                      const arr = [...selectedIncident.workarounds];
                      arr[idx] = e.target.value;
                      updateIncidentField(selectedIncident.id, 'workarounds', arr);
                    }} className="border px-2 py-1 rounded w-full text-sm"/>
                    <button onClick={() => {
                      const arr = selectedIncident.workarounds.filter((_, i) => i !== idx);
                      updateIncidentField(selectedIncident.id, 'workarounds', arr);
                    }} className="text-red-600 font-bold">X</button>
                  </div>
                ))}
                <button onClick={() => updateIncidentField(selectedIncident.id, 'workarounds', [...selectedIncident.workarounds, 'New Workaround'])} className="mt-2 px-2 py-1 bg-green-600 text-white rounded text-sm">Add Workaround</button>
              </div>

              {/* Updates */}
              <div className="mt-4">
                <h5 className="font-semibold">Recent Updates</h5>
                {selectedIncident.updates.map(update => (
                  <div key={update.id} className="p-2 bg-gray-50 rounded mt-1 text-sm">
                    <span className="font-medium">{update.author}</span>: {update.content} <br/>
                    <span className="text-xs text-gray-500">{new Date(update.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                <button onClick={() => addIncidentUpdate(selectedIncident.id, 'New update', 'System')} className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm">Add Update</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select an incident to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MajorIncidentManagement;
