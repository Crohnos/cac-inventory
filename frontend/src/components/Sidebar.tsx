import { useState } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Package, PlusSquare, QrCode, FileSpreadsheet } from 'lucide-react'

interface SidebarProps {
  isMobileOpen?: boolean
  onToggleMobile?: () => void
}

const Sidebar = ({ isMobileOpen = false, onToggleMobile }: SidebarProps) => {
  const { location } = useRouterState()
  
  // Helper to determine if link is active
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  }
  
  return (
    <>
      {/* Mobile backdrop - only shown when sidebar is open on mobile */}
      {isMobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={onToggleMobile}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar container */}
      <aside className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo-link">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="36" 
              height="36" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M5 8h14"></path>
              <path d="M5 12h14"></path>
              <path d="M5 16h14"></path>
              <path d="M3 21h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
            </svg>
            <span className="sidebar-title">Rainbow Room</span>
          </Link>
          
          {/* Mobile close button */}
          {onToggleMobile && (
            <button 
              className="sidebar-close-mobile" 
              onClick={onToggleMobile}
              aria-label="Close menu"
            >
              &times;
            </button>
          )}
        </div>
        
        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <ul className="sidebar-menu">
              <li className="sidebar-menu-item">
                <Link 
                  to="/" 
                  className={`sidebar-link ${isActive('/') ? 'active' : ''}`}
                  onClick={isMobileOpen ? onToggleMobile : undefined}
                >
                  <span className="sidebar-icon">
                    <Package size={30} />
                  </span> 
                  <span className="sidebar-text">Inventory</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/add" 
                  className={`sidebar-link ${isActive('/add') ? 'active' : ''}`}
                  onClick={isMobileOpen ? onToggleMobile : undefined}
                >
                  <span className="sidebar-icon">
                    <PlusSquare size={30} />
                  </span> 
                  <span className="sidebar-text">Add New</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/scan" 
                  className={`sidebar-link ${isActive('/scan') ? 'active' : ''}`}
                  onClick={isMobileOpen ? onToggleMobile : undefined}
                >
                  <span className="sidebar-icon">
                    <QrCode size={30} />
                  </span> 
                  <span className="sidebar-text">Scan</span>
                </Link>
              </li>
              <li className="sidebar-menu-item">
                <Link 
                  to="/import-export" 
                  className={`sidebar-link ${isActive('/import-export') ? 'active' : ''}`}
                  onClick={isMobileOpen ? onToggleMobile : undefined}
                >
                  <span className="sidebar-icon">
                    <FileSpreadsheet size={30} />
                  </span> 
                  <span className="sidebar-text">Import/Export</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-footer-content">
            <p className="sidebar-footer-text">
              <small>Children's Advocacy Center</small>
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar