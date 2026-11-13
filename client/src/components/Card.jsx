import React from 'react';
import { classNames } from '../utils/formatters';

const Card = ({ title, children, className }) => {
  return (
    <div className={classNames('card', className)}>
      {title && <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
