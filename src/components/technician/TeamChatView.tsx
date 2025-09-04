import React from 'react';

const TeamChatView: React.FC = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Chat</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Online Team Members</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Sarah Wilson (Online)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Mike Johnson (Online)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span>David Brown (Away)</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2 border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Group Chat</h3>
          <div className="h-64 border rounded p-3 mb-3 overflow-y-auto">
            <div className="text-right mb-2">
              <div className="bg-blue-100 rounded-lg p-2 inline-block">Hey team, anyone available for the server issue?</div>
            </div>
            <div className="text-left mb-2">
              <div className="bg-gray-100 rounded-lg p-2 inline-block">I can help, what's the ticket number?</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Type a message..." className="flex-1 p-2 border rounded" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamChatView;