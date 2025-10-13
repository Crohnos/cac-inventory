import React, { useState } from 'react';
import { Clock, Plus, BarChart3, List } from 'lucide-react';
import { VolunteerHoursForm } from '../components/volunteer/VolunteerHoursForm';
import { SessionsList } from '../components/volunteer/SessionsList';
import { VolunteerStats } from '../components/volunteer/VolunteerStats';
import { EditSessionModal } from '../components/volunteer/EditSessionModal';
import { useLocationStore } from '../stores/locationStore';
import type { VolunteerSession } from '../services/volunteerService';

type ViewMode = 'form' | 'list' | 'stats';

export const VolunteerHoursPage: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewMode>('form');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingSession, setEditingSession] = useState<VolunteerSession | null>(null);
  
  const { getCurrentLocation } = useLocationStore();
  const currentLocation = getCurrentLocation();

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of sessions list
    // Optionally switch to sessions view after successful submission
    setActiveView('list');
  };

  const handleEditSession = (session: VolunteerSession) => {
    setEditingSession(session);
  };

  const handleEditModalClose = () => {
    setEditingSession(null);
  };

  const handleEditSuccess = () => {
    setRefreshTrigger(prev => prev + 1); // Trigger refresh of sessions list
    setEditingSession(null);
  };

  const tabs = [
    {
      id: 'form' as ViewMode,
      label: 'Log Hours',
      icon: Plus,
      description: 'Record new volunteer session'
    },
    {
      id: 'list' as ViewMode,
      label: 'Sessions',
      icon: List,
      description: 'View recent sessions'
    },
    {
      id: 'stats' as ViewMode,
      label: 'Reports',
      icon: BarChart3,
      description: 'Volunteer statistics'
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <Clock className="h-6 md:h-8 w-6 md:w-8 mr-2 md:mr-3 text-blue-600 flex-shrink-0" />
          Volunteer Hours
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1 ml-8 md:ml-11">
          Track and manage volunteer sessions for {currentLocation?.name || 'all locations'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 min-w-max" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm flex items-center space-x-1 md:space-x-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Descriptions */}
        <div className="px-4 md:px-6 py-2 bg-gray-50 border-b border-gray-200">
          <p className="text-xs md:text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeView)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeView === 'form' && (
          <VolunteerHoursForm onSuccess={handleFormSuccess} />
        )}

        {activeView === 'list' && (
          <SessionsList 
            refreshTrigger={refreshTrigger} 
            onEditSession={handleEditSession}
          />
        )}

        {activeView === 'stats' && (
          <VolunteerStats />
        )}
      </div>

      {/* Quick Stats Footer (shown on all tabs) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Quick Tip:</p>
            <p>
              {activeView === 'form' && 'Fill out start and end times for automatic hour calculation, or enter hours manually.'}
              {activeView === 'list' && 'Use filters to search by volunteer name, location, or date range.'}
              {activeView === 'stats' && 'Use the date range filters to view statistics for specific time periods.'}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Session Modal */}
      {editingSession && (
        <EditSessionModal
          session={editingSession}
          isOpen={!!editingSession}
          onClose={handleEditModalClose}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};