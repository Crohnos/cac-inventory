import { Link } from '@tanstack/react-router'

const NotFoundPage = () => {
  return (
    <div className="text-center">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <Link to="/">
        <button>Return to Inventory</button>
      </Link>
    </div>
  )
}

export default NotFoundPage