import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-sm text-gray-600">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary inline-flex items-center">
            Go back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
