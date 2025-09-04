import React from 'react';

const ReportsView: React.FC = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Weekly Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Tickets Resolved:</span>
              <span className="font-semibold">24</span>
            </div>
            <div className="flex justify-between">
              <span>Average Resolution Time:</span>
              <span className="font-semibold">3.2 hours</span>
            </div>
            <div className="flex justify-between">
              <span>Customer Satisfaction:</span>
              <span className="font-semibold">4.8/5</span>
            </div>
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Report Categories</h3>
          <div className="space-y-2">
            <button className="w-full text-left p-2 border rounded hover:bg-gray-50">Ticket Analytics</button>
            <button className="w-full text-left p-2 border rounded hover:bg-gray-50">Performance Metrics</button>
            <button className="w-full text-left p-2 border rounded hover:bg-gray-50">Time Tracking</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;