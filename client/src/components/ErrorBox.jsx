import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorBox = ({ message, onRetry }) => {
  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200 w-full">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-red-700">{message || 'An error occurred.'}</p>
          {onRetry && (
            <p className="mt-3 text-sm md:mt-0 md:ml-6">
              <button
                onClick={onRetry}
                className="whitespace-nowrap font-medium text-red-700 hover:text-red-600 flex items-center space-x-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBox;
