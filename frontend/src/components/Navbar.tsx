import { Link, useRouterState } from '@tanstack/react-router'

const Navbar = () => {
  const { location } = useRouterState()
  
  // Helper to determine if link is active
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  }
  
  return (
    <nav className="container">
      <div className="navbar-brand">
        <Link to="/" className="logo-link">
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
            style={{ marginRight: '8px' }}
          >
            <path d="M5 8h14"></path>
            <path d="M5 12h14"></path>
            <path d="M5 16h14"></path>
            <path d="M3 21h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z"></path>
          </svg>
          <strong>Rainbow Room</strong>
        </Link>
      </div>
      <ul className="navbar-menu">
        <li><Link to="/" className={isActive('/') ? 'active' : ''}>
          <span className="nav-icon">📦</span> Inventory
        </Link></li>
        <li><Link to="/add" className={isActive('/add') ? 'active' : ''}>
          <span className="nav-icon">➕</span> Add New
        </Link></li>
        <li><Link to="/scan" className={isActive('/scan') ? 'active' : ''}>
          <span className="nav-icon">📷</span> Scan
        </Link></li>
        <li><Link to="/import-export" className={isActive('/import-export') ? 'active' : ''}>
          <span className="nav-icon">📊</span> Import/Export
        </Link></li>
      </ul>
    </nav>
  )
}

export default Navbar