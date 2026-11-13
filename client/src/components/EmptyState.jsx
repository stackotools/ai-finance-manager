import React from 'react';
import { Link } from 'react-router-dom';

const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      {Icon && (
        <div className="mx-auto h-12 w-12 text-gray-400 flex items-center justify-center bg-gray-50 rounded-full mb-4">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
      )}
      <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <div>
          {React.isValidElement(action) ? (
            action
          ) : typeof action === 'object' && action.href ? (
            <Link to={action.href} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              {action.label || 'Action'}
            </Link>
          ) : typeof action === 'object' && action.onClick ? (
            <button onClick={action.onClick} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
              {action.label || 'Action'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
