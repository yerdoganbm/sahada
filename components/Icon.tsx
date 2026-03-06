import React from 'react';
import { CSSProperties } from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  filled?: boolean;
  style?: CSSProperties;
}

/**
 * Icon — Material Symbols Rounded
 * Outfit's * font-family !important is overridden via dedicated CSS rule in index.html
 */
export const Icon: React.FC<IconProps> = ({ name, size = 24, className = '', filled = false, style }) => {
  return (
    <span
      className={`material-symbols-rounded${className ? ' ' + className : ''}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size <= 20 ? 20 : size <= 24 ? 24 : 48}`,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        userSelect: 'none',
        width: size,
        height: size,
        overflow: 'hidden',
        ...style,
      }}
    >
      {name}
    </span>
  );
};
