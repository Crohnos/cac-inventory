import React from 'react';
import { FileText } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">View inventory reports and analytics</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Reports Dashboard</h2>
        <p className="text-gray-600">
          This will display inventory reports and analytics
        </p>
      </div>
    </div>
  );
};