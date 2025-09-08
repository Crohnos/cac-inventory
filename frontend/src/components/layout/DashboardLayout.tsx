import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CartModal } from '../cart/CartModal';
import { ToastContainer } from '../shared/ToastContainer';
import { useCartStore } from '../../stores/cartStore';

export const DashboardLayout: React.FC = () => {
  const { isVisible: isCartVisible } = useCartStore();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - always visible on desktop, slide-in on mobile */}
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar with location and cart */}
        <Navbar />
        
        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Cart modal - overlay when visible */}
      {isCartVisible && <CartModal />}
      
      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};