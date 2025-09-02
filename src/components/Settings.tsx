import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  accessLevel: string;
}

interface TicketField {
  id: string;
  name: string;
  type: string;
}

const Settings: React.FC = () => {
  // Roles & Permissions
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Manager', accessLevel: 'Full' },
    { id: '2', name: 'Technician', accessLevel: 'Limited' },
  ]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleAccess, setNewRoleAccess] = useState('Limited');

  // Ticket Fields
  const [ticketFields, setTicketFields] = useState<TicketField[]>([
    { id: '1', name: 'Priority', type: 'Dropdown' },
    { id: '2', name: 'Category', type: 'Dropdown' },
  ]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');

  // Email Templates
  const [emailTemplate, setEmailTemplate] = useState('Default template');

  // Integrations
  const [integrations, setIntegrations] = useState([
    { id: '1', name: 'Outlook', enabled: true },
    { id: '2', name: 'Teams', enabled: true },
    { id: '3', name: 'Slack', enabled: false },
  ]);

  // Role functions
  const addRole = () => {
    if (!newRoleName) return;
    setRoles([...roles, { id: Date.now().toString(), name: newRoleName, accessLevel: newRoleAccess }]);
    setNewRoleName('');
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
  };

  // Ticket Field functions
  const addTicketField = () => {
    if (!newFieldName) return;
    setTicketFields([...ticketFields, { id: Date.now().toString(), name: newFieldName, type: newFieldType }]);
    setNewFieldName('');
  };

  const removeTicketField = (id: string) => {
    setTicketFields(ticketFields.filter(f => f.id !== id));
  };

  // Integration toggle
  const toggleIntegration = (id: string) => {
    setIntegrations(integrations.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">

        {/* Roles & Permissions */}
        <div>
          <h3 className="font-semibold mb-2">Roles & Permissions</h3>
          <div className="flex space-x-2 mb-2">
            <input type="text" placeholder="Role Name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="border px-2 py-1 rounded flex-1"/>
            <select value={newRoleAccess} onChange={e => setNewRoleAccess(e.target.value)} className="border px-2 py-1 rounded">
              <option>Limited</option>
              <option>Full</option>
            </select>
            <button onClick={addRole} className="bg-blue-500 text-white px-4 rounded flex items-center space-x-1">
              <Plus className="w-4 h-4"/> <span>Add</span>
            </button>
          </div>
          <ul>
            {roles.map(r => (
              <li key={r.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                {r.name} - {r.accessLevel}
                <button onClick={() => removeRole(r.id)} className="text-red-500">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Ticket Fields */}
        <div>
          <h3 className="font-semibold mb-2">Ticket Fields</h3>
          <div className="flex space-x-2 mb-2">
            <input type="text" placeholder="Field Name" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} className="border px-2 py-1 rounded flex-1"/>
            <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)} className="border px-2 py-1 rounded">
              <option>Text</option>
              <option>Dropdown</option>
              <option>Date</option>
            </select>
            <button onClick={addTicketField} className="bg-blue-500 text-white px-4 rounded flex items-center space-x-1">
              <Plus className="w-4 h-4"/> <span>Add</span>
            </button>
          </div>
          <ul>
            {ticketFields.map(f => (
              <li key={f.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                {f.name} - {f.type}
                <button onClick={() => removeTicketField(f.id)} className="text-red-500">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Email Templates */}
        <div>
          <h3 className="font-semibold mb-2">Email Templates</h3>
          <textarea
            value={emailTemplate}
            onChange={e => setEmailTemplate(e.target.value)}
            className="border rounded w-full px-2 py-1"
            rows={3}
          />
        </div>

        {/* Integrations */}
        <div>
          <h3 className="font-semibold mb-2">Integrations</h3>
          <ul>
            {integrations.map(i => (
              <li key={i.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                {i.name}
                <button onClick={() => toggleIntegration(i.id)} className={`px-2 py-1 rounded ${i.enabled ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                  {i.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Settings;
