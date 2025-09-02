import React, { useState } from 'react';
import { Plus, Trash2, Edit, Play } from 'lucide-react';

interface WorkflowRule {
  id: string;
  name: string;
  condition: string;
  action: string;
}

const Automation: React.FC = () => {
  const [rules, setRules] = useState<WorkflowRule[]>([]);
  const [newName, setNewName] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newAction, setNewAction] = useState('');

  // Add a new workflow rule
  const addRule = () => {
    if (!newName || !newCondition || !newAction) return;
    setRules([
      ...rules,
      { id: Date.now().toString(), name: newName, condition: newCondition, action: newAction },
    ]);
    setNewName('');
    setNewCondition('');
    setNewAction('');
  };

  // Delete a rule
  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // Simulate running rules (e.g., sending email/Teams notification)
  const runRule = (rule: WorkflowRule) => {
    // Here you can integrate SendGrid or Microsoft Graph API in the future
    alert(`Rule Triggered!\nName: ${rule.name}\nCondition: ${rule.condition}\nAction: ${rule.action}\n\nSimulating notification to support@hapo.co.za`);
    console.log(`Notification sent for rule "${rule.name}" to support@hapo.co.za`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Workflow Builder</h2>

      {/* Add Rule */}
      <div className="mb-6 flex space-x-2">
        <input
          type="text"
          placeholder="Rule Name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <input
          type="text"
          placeholder="Condition"
          value={newCondition}
          onChange={e => setNewCondition(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <input
          type="text"
          placeholder="Action"
          value={newAction}
          onChange={e => setNewAction(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
        />
        <button
          onClick={addRule}
          className="bg-blue-500 text-white px-4 rounded flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" /> <span>Add</span>
        </button>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        {rules.map(rule => (
          <div key={rule.id} className="border-b last:border-b-0 py-2 flex justify-between items-center">
            <div>
              <p className="font-medium">{rule.name}</p>
              <p className="text-gray-600 text-sm">
                If <strong>{rule.condition}</strong> then <strong>{rule.action}</strong>
              </p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => runRule(rule)} className="text-green-500 flex items-center space-x-1">
                <Play className="w-4 h-4" /> <span>Run</span>
              </button>
              <button onClick={() => deleteRule(rule.id)} className="text-red-500 flex items-center space-x-1">
                <Trash2 className="w-4 h-4" /> <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <p className="text-gray-500">No workflow rules added yet.</p>}
      </div>
    </div>
  );
};

export default Automation;
