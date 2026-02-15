/**
 * Mobile Header Component
 * Fixed header for mobile screens
 */

import React from 'react';
import { Icon } from './Icon';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: string;
    onClick: () => void;
    badge?: number;
  };
}

export function MobileHeader({ title, showBack, onBack, rightAction }: MobileHeaderProps) {
  return (
    <header className="mobile-header mobile-only safe-top">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="tap-highlight"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Geri"
          >
            <Icon name="arrow_back" />
          </button>
        )}
        <h1
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {rightAction && (
        <button
          onClick={rightAction.onClick}
          className="tap-highlight"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
          }}
          aria-label="Aksiyon"
        >
          <Icon name={rightAction.icon} />
          {rightAction.badge && rightAction.badge > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {rightAction.badge > 9 ? '9+' : rightAction.badge}
            </span>
          )}
        </button>
      )}
    </header>
  );
}
