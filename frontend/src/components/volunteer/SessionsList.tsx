import React, { useState, useEffect } from 'react';
import { Clock, User, MapPin, Calendar, Edit, Trash2, Filter } from 'lucide-react';
import { volunteerService, type VolunteerSession, type SessionFilters } from '../../services/volunteerService';
import { useLocationStore } from '../../stores/locationStore';
import { useUIStore } from '../../stores/uiStore';

interface SessionsListProps {
  onEditSession?: (session: VolunteerSession) => void;
  refreshTrigger?: number;
}

export const SessionsList: React.FC<SessionsListProps> = ({
  onEditSession,
  refreshTrigger
}) => {
  const [sessions, setSessions] = useState<VolunteerSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [filters, setFilters] = useState<SessionFilters>({
    limit: 20
  });
  
  const { locations } = useLocationStore();
  const { addToast } = useUIStore();

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const sessionsData = await volunteerService.getSessions(filters);
      setSessions(sessionsData);
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Load Sessions',
        message: error.message || 'An error occurred while loading volunteer sessions'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [refreshTrigger, filters]);

  const handleDeleteSession = async (sessionId: number, volunteerName: string) => {
    if (!confirm(`Are you sure you want to delete the volunteer session for ${volunteerName}?`)) {
      return;
    }

    try {
      await volunteerService.deleteSession(sessionId);
      addToast({
        type: 'success',
        title: 'Session Deleted',
        message: `Volunteer session for ${volunteerName} has been deleted`
      });
      loadSessions(); // Refresh list
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Delete Session',
        message: error.message || 'An error occurred while deleting the volunteer session'
      });
    }
  };

  const handleFilterChange = (key: keyof SessionFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  const clearFilters = () => {
    setFilters({ limit: 20 });
    setShowFilters(false);
    setShowActiveOnly(false);
  };

  // Filter sessions for active-only view
  const displayedSessions = showActiveOnly 
    ? sessions.filter(session => !session.end_time)
    : sessions;

  const activeSessionsCount = sessions.filter(session => !session.end_time).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              {showActiveOnly ? 'Active Sessions' : 'Recent Volunteer Sessions'}
            </h3>
            {activeSessionsCount > 0 && (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {activeSessionsCount} active
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {activeSessionsCount > 0 && (
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`flex items-center space-x-2 px-3 py-1 text-sm rounded-md transition-colors ${
                  showActiveOnly 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'text-green-600 bg-green-100 hover:bg-green-200'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>{showActiveOnly ? 'Show All' : 'Active Only'}</span>
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Location
                </label>
                <select
                  value={filters.location_id || ''}
                  onChange={(e) => handleFilterChange('location_id', e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All locations</option>
                  {locations.map(location => (
                    <option key={location.location_id} value={location.location_id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Volunteer Name
                </label>
                <input
                  type="text"
                  value={filters.volunteer_name || ''}
                  onChange={(e) => handleFilterChange('volunteer_name', e.target.value)}
                  placeholder="Search by name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-3 flex justify-end space-x-2">
              <button
                onClick={clearFilters}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-md transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {displayedSessions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {showActiveOnly ? 'No active volunteer sessions' : 'No volunteer sessions found'}
            </p>
            <p className="text-sm text-gray-400">
              {showActiveOnly 
                ? 'Active sessions will appear here when volunteers check in without an end time'
                : 'Sessions will appear here once they\'re logged'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedSessions.map((session) => {
              const isActive = !session.end_time;
              return (
              <div
                key={session.session_id}
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  isActive 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <div className="flex items-center text-lg font-medium text-gray-900">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        {session.volunteer_name}
                        {isActive && (
                          <div className="ml-2 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="ml-1 text-xs text-green-700 font-medium">ACTIVE</span>
                          </div>
                        )}
                      </div>
                      
                      {session.hours_worked ? (
                        <div className="flex items-center text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {session.hours_worked} hrs
                        </div>
                      ) : isActive && (
                        <div className="flex items-center text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          In progress...
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-2">
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {session.location_name}
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(session.session_date)}
                      </div>
                      
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(session.start_time)}
                        {session.end_time && ` - ${formatTime(session.end_time)}`}
                      </div>
                    </div>
                    
                    {session.tasks_performed && (
                      <div className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Tasks:</span> {session.tasks_performed}
                      </div>
                    )}
                    
                    {session.notes && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {session.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {onEditSession && (
                      <button
                        onClick={() => onEditSession(session)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit session"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteSession(session.session_id!, session.volunteer_name)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};