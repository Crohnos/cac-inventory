import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, Plus, Scan, Clock, FileText, X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

const navigation = [
  { name: 'Inventory', href: '/', icon: Package },
  { name: 'Add New Item', href: '/add-item', icon: Plus },
  { name: 'Scan', href: '/scan', icon: Scan },
  { name: 'Volunteer Hours', href: '/volunteer-hours', icon: Clock },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 
        transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-200 ease-in-out
        md:flex md:flex-col
      `}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo/Brand */}
          <div className="flex items-center justify-between px-4 py-6">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(to right, #595a5c, #45b249)'}}>
                <span className="text-white font-bold text-sm">RR</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-brand">
                Rainbow Room
              </span>
            </div>
            
            {/* Close button for mobile */}
            <button
              onClick={closeSidebar}
              className="md:hidden p-1 rounded-lg hover:bg-gray-100 text-brand"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    onClick={() => closeSidebar()} // Close sidebar on mobile when navigating
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors border-r-2 hover-green ${
                        isActive
                          ? ''
                          : 'text-brand hover:bg-gray-50 border-transparent'
                      }`
                    }
                    style={({ isActive }) => isActive ? {
                      backgroundColor: 'rgba(69, 178, 73, 0.1)', 
                      color: '#45b249',
                      borderRightColor: '#45b249'
                    } : {}}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className="mr-3 h-5 w-5"
                          style={{color: isActive ? '#45b249' : '#595a5c'}}
                        />
                        {item.name}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};