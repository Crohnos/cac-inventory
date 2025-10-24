import React, { useState } from 'react';
import { Clock, User, Calendar, Save, X } from 'lucide-react';
import { useVolunteerStore, type CreateVolunteerSessionData } from '../../stores/volunteerStore';
import { useLocationStore } from '../../stores/locationStore';
import { useUIStore } from '../../stores/uiStore';

interface VolunteerHoursFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const VolunteerHoursForm: React.FC<VolunteerHoursFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState<CreateVolunteerSessionData>({
    location_id: 0,
    volunteer_name: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    tasks_performed: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  
  const { locations, currentLocationId } = useLocationStore();
  const { addToast } = useUIStore();
  const { createSession } = useVolunteerStore();

  React.useEffect(() => {
    if (currentLocationId) {
      setFormData(prev => ({ ...prev, location_id: currentLocationId }));
    }
  }, [currentLocationId]);

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    // Handle case where end time is next day (past midnight)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'location_id' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.volunteer_name.trim()) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Volunteer name is required'
      });
      return;
    }

    if (!formData.start_time) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Start time is required'
      });
      return;
    }

    if (!formData.location_id) {
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please select a location'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate hours if both times are provided
      let sessionData = { ...formData };
      if (formData.end_time) {
        sessionData.hours_worked = calculateHours(formData.start_time, formData.end_time);
      }

      await createSession(sessionData);
      
      addToast({
        type: 'success',
        title: 'Session Logged',
        message: `Volunteer hours recorded for ${formData.volunteer_name}`
      });

      // Reset form
      setFormData({
        location_id: currentLocationId || 0,
        volunteer_name: '',
        session_date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        tasks_performed: '',
        notes: ''
      });

      onSuccess?.();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Log Hours',
        message: error.message || 'An error occurred while logging volunteer hours'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedHours = formData.start_time && formData.end_time 
    ? calculateHours(formData.start_time, formData.end_time)
    : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-blue-600" />
          Log Volunteer Hours
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Volunteer Name */}
          <div className="md:col-span-2">
            <label htmlFor="volunteer_name" className="block text-sm font-medium text-gray-700 mb-1">
              Volunteer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="volunteer_name"
                name="volunteer_name"
                value={formData.volunteer_name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter volunteer name"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location_id" className="block text-sm font-medium text-gray-700 mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select location</option>
              {locations.map(location => (
                <option key={location.location_id} value={location.location_id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Date */}
          <div>
            <label htmlFor="session_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="session_date"
                name="session_date"
                value={formData.session_date}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
              <button
                type="button"
                onClick={() => setShowEndTime(!showEndTime)}
                className="ml-2 text-xs text-blue-600 hover:text-blue-800"
              >
                {showEndTime ? 'Hide' : 'Add end time'}
              </button>
            </label>
            {showEndTime && (
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        </div>

        {/* Calculated Hours */}
        {calculatedHours > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <Clock className="inline h-4 w-4 mr-1" />
              Calculated hours: <span className="font-semibold">{calculatedHours}</span>
            </p>
          </div>
        )}

        {/* Tasks Performed */}
        <div>
          <label htmlFor="tasks_performed" className="block text-sm font-medium text-gray-700 mb-1">
            Tasks Performed
          </label>
          <textarea
            id="tasks_performed"
            name="tasks_performed"
            value={formData.tasks_performed}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe what tasks were completed during this session..."
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Any additional notes about this volunteer session..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Logging...' : 'Log Hours'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};