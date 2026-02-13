import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', filled = false }) => {
  return (
    <span 
      className={`material-icons-round ${className}`}
      style={{ 
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0"
      }}
    >
      {name}
    </span>
  );
};