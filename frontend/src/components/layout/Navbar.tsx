import React from 'react';
import { MapPin, ShoppingCart, Menu } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { useCartStore } from '../../stores/cartStore';
import { useUIStore } from '../../stores/uiStore';
import { LocationSelector } from '../shared/LocationSelector';

export const Navbar: React.FC = () => {
  const { getCurrentLocation } = useLocationStore();
  const { getTotalItems, toggleCart } = useCartStore();
  const { toggleSidebar } = useUIStore();
  const [isFlashing, setIsFlashing] = React.useState(false);
  
  const currentLocation = getCurrentLocation();
  const totalItems = getTotalItems();
  
  // Flash cart icon periodically when it has items
  React.useEffect(() => {
    if (totalItems > 0) {
      const interval = setInterval(() => {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 1000);
      }, 5000); // Flash every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [totalItems]);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Mobile menu button + Location info */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-brand"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" style={{color: '#45b249'}} />
            <span className="font-medium text-brand">
              {currentLocation?.name || 'Select Location'}
            </span>
          </div>
          <LocationSelector />
        </div>
        
        {/* Right: Cart */}
        <button
          onClick={toggleCart}
          className={`relative p-3 rounded-lg transition-all min-w-12 min-h-12 border-2 ${
            isFlashing 
              ? 'cart-flash border-caccc-green' 
              : 'border-transparent hover:bg-gray-100'
          }`}
        >
          <ShoppingCart className="h-6 w-6 text-brand" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold" style={{backgroundColor: '#45b249'}}>
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};