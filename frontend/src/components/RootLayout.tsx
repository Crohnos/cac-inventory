import { useState } from 'react'
import { Outlet } from '@tanstack/react-router'
import Sidebar from './Sidebar'
import Breadcrumbs from './Breadcrumbs'

const RootLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev)
  }
  
  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onToggleMobile={toggleMobileSidebar} 
      />
      
      {/* Mobile header with menu toggle */}
      <header className="mobile-header">
        <button 
          className="sidebar-toggle" 
          onClick={toggleMobileSidebar}
          aria-label="Toggle menu"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 12h18"></path>
            <path d="M3 6h18"></path>
            <path d="M3 18h18"></path>
          </svg>
        </button>
        <div className="mobile-title">Rainbow Room</div>
      </header>
      
      {/* Main content */}
      <div className="main-content">
        <main className="content-container">
          <Breadcrumbs />
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
        
        <footer className="footer text-center">
          <div className="footer-content">
            <p>
              <strong>Rainbow Room Inventory System</strong>
              <br />
              <small>Children's Advocacy Center &copy; {new Date().getFullYear()}</small>
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default RootLayout