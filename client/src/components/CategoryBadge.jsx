import React from 'react';
import { classNames } from '../utils/formatters';

const CategoryBadge = ({ category, source, className }) => {
  if (!category) return null;

  return (
    <div className={classNames("inline-flex items-center space-x-1.5", className)}>
      <span 
        className="h-2.5 w-2.5 rounded-full" 
        style={{ backgroundColor: category.color || '#9ca3af' }}
      ></span>
      <span className="text-sm font-medium text-gray-700">
        {category.name}
      </span>
      {source && (
        <span className={classNames(
          "ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
          source === 'ai' || source === 'auto' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
        )}>
          {source === 'ai' ? 'AI' : source === 'auto' ? 'Auto' : 'Manual'}
        </span>
      )}
    </div>
  );
};

export default CategoryBadge;
