import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-caccc-grey/40 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-brand mb-4">Page Not Found</h2>
        <p className="text-caccc-grey/70 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          to="/" 
          className="btn-primary inline-flex items-center space-x-2"
        >
          <Home className="h-5 w-5" />
          <span>Back to Inventory</span>
        </Link>
      </div>
    </div>
  );
};