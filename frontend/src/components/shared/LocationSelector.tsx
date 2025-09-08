import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';

export const LocationSelector: React.FC = () => {
  const { locations, currentLocationId, setCurrentLocation } = useLocationStore();
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (locations.length <= 1) return null;
  
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm border rounded-lg min-h-12 text-brand transition-colors hover:bg-gray-50"
        style={{borderColor: 'rgba(89, 90, 92, 0.3)'}}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(69, 178, 73, 0.1)';
          e.currentTarget.style.borderColor = '#45b249';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
          e.currentTarget.style.borderColor = 'rgba(89, 90, 92, 0.3)';
        }}
      >
        <span>Switch Location</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{color: '#45b249'}} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {locations.map((location) => (
                <button
                  key={location.location_id}
                  onClick={() => {
                    setCurrentLocation(location.location_id);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={currentLocationId === location.location_id ? {
                    backgroundColor: 'rgba(69, 178, 73, 0.1)',
                    color: '#45b249',
                    fontWeight: '500'
                  } : {color: '#595a5c'}}
                  onMouseEnter={(e) => {
                    if (currentLocationId !== location.location_id) {
                      e.currentTarget.style.backgroundColor = 'rgba(69, 178, 73, 0.1)';
                      e.currentTarget.style.color = '#45b249';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentLocationId !== location.location_id) {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '#595a5c';
                    }
                  }}
                >
                  {location.name}
                  <div className="text-xs" style={{color: 'rgba(89, 90, 92, 0.7)'}}>{location.city}, {location.state}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};