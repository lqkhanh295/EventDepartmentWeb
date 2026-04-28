import React from 'react';

const BentoGrid = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bento-container ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default BentoGrid;