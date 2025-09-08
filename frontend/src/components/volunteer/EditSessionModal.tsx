import React, { useState, useEffect } from 'react';
import { X, Save, Clock, User, Calendar } from 'lucide-react';
import { volunteerService, type VolunteerSession, type CreateVolunteerSessionData } from '../../services/volunteerService';
import { useLocationStore } from '../../stores/locationStore';
import { useUIStore } from '../../stores/uiStore';

interface EditSessionModalProps {
  session: VolunteerSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Partial<CreateVolunteerSessionData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { locations } = useLocationStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (session) {
      setFormData({
        location_id: session.location_id,
        volunteer_name: session.volunteer_name,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time || '',
        hours_worked: session.hours_worked,
        tasks_performed: session.tasks_performed || '',
        notes: session.notes || ''
      });
    }
  }, [session]);

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
    
    if (!formData.volunteer_name?.trim()) {
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

    setIsSubmitting(true);

    try {
      // Calculate hours if both times are provided
      let updateData = { ...formData };
      if (formData.start_time && formData.end_time) {
        updateData.hours_worked = calculateHours(formData.start_time, formData.end_time);
      }

      await volunteerService.updateSession(session.session_id!, updateData);
      
      addToast({
        type: 'success',
        title: 'Session Updated',
        message: `Session for ${formData.volunteer_name} has been updated`
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to Update Session',
        message: error.message || 'An error occurred while updating the session'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedHours = formData.start_time && formData.end_time 
    ? calculateHours(formData.start_time, formData.end_time)
    : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 backdrop-blur-sm transition-all duration-300"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative inline-block align-middle bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full sm:p-6 z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Edit Volunteer Session
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
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
                    value={formData.volunteer_name || ''}
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
                  value={formData.location_id || ''}
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
                    value={formData.session_date || ''}
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
                  value={formData.start_time || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  id="end_time"
                  name="end_time"
                  value={formData.end_time || ''}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                value={formData.tasks_performed || ''}
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
                value={formData.notes || ''}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Any additional notes about this volunteer session..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Session'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};