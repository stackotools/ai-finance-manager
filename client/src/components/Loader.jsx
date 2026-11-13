import React from 'react';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  );
};

export default Loader;
