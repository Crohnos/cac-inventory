import { Link, useRouterState } from '@tanstack/react-router'
import { useBreadcrumbs, BreadcrumbItem } from '../hooks/useBreadcrumbs'

type BreadcrumbsProps = {
  items?: BreadcrumbItem[]
}

const Breadcrumbs = ({ items }: BreadcrumbsProps = {}) => {
  const routerState = useRouterState()
  const { location } = routerState
  
  // Get the current params from the router state
  const params = routerState.matches.reduce((acc, match) => {
    return { ...acc, ...match.params }
  }, {})
  
  // If no items are provided, generate them based on the current route and params
  const generatedItems = useBreadcrumbs(location.pathname, params)
  const breadcrumbItems = items || generatedItems
  
  // Don't render breadcrumbs on the home page
  if (location.pathname === '/' && breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <nav className="breadcrumbs">
      <ul>
        <li><Link to="/">Home</Link></li>
        {breadcrumbItems.map((item, index) => (
          <li key={index}>
            {item.to ? (
              <Link to={item.to}>{item.label}</Link>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Breadcrumbs