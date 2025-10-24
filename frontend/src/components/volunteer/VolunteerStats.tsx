import React, { useState, useEffect } from 'react';
import { Users, Clock, MapPin, Calendar, TrendingUp } from 'lucide-react';
import { useVolunteerStore, type VolunteerStats as VolunteerStatsType } from '../../stores/volunteerStore';
import { useLocationStore } from '../../stores/locationStore';

export const VolunteerStats: React.FC = () => {
  const [stats, setStats] = useState<VolunteerStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    date_from: '',
    date_to: ''
  });
  
  const { currentLocationId } = useLocationStore();
  const { getVolunteerStats } = useVolunteerStore();

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (currentLocationId) filters.location_id = currentLocationId;
      if (dateRange.date_from) filters.date_from = dateRange.date_from;
      if (dateRange.date_to) filters.date_to = dateRange.date_to;

      const statsData = await getVolunteerStats(filters);
      setStats(statsData);
    } catch (error: any) {
      console.error('Failed to load volunteer stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [currentLocationId, dateRange]);

  const handleDateRangeChange = (key: string, value: string) => {
    setDateRange(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded-lg">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Stats Header with Date Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Volunteer Statistics
          </h3>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateRange.date_from}
                onChange={(e) => handleDateRangeChange('date_from', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateRange.date_to}
                onChange={(e) => handleDateRangeChange('date_to', e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Sessions</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-900">Total Hours</p>
                <p className="text-2xl font-bold text-green-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-purple-900">Unique Volunteers</p>
                <p className="text-2xl font-bold text-purple-900">{stats.uniqueVolunteers}</p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-orange-900">Avg. Session</p>
                <p className="text-2xl font-bold text-orange-900">{stats.averageSessionLength}h</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions by Location */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Sessions by Location
        </h4>
        
        {stats.sessionsByLocation.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No location data available</p>
        ) : (
          <div className="space-y-3">
            {stats.sessionsByLocation.map((location) => (
              <div key={location.location_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{location.location_name}</p>
                  <p className="text-sm text-gray-500">{location.session_count} sessions</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">{location.total_hours} hours</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Volunteers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Recent Volunteers
        </h4>
        
        {stats.recentVolunteers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No volunteer data available</p>
        ) : (
          <div className="space-y-3">
            {stats.recentVolunteers.map((volunteer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{volunteer.volunteer_name}</p>
                  <p className="text-sm text-gray-500">
                    Last session: {new Date(volunteer.last_session).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{volunteer.total_hours} hours</p>
                  <p className="text-sm text-gray-500">{volunteer.total_sessions} sessions</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};