/**
 * Mobile Header Component
 * Fixed header for mobile screens
 */

import React from 'react';
import { Icon } from './Icon';

interface ActionButtonProps {
  icon: string;
  onClick: () => void;
  badge?: number;
}

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  leftAction?: ActionButtonProps;
  rightAction?: ActionButtonProps;
}

function ActionButton({ icon, onClick, badge }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="tap-highlight"
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        flexShrink: 0,
      }}
      aria-label="Aksiyon"
    >
      <Icon name={icon} style={{ fontSize: '20px', color: '#fff' }} />
      {badge != null && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            minWidth: '16px',
            height: '16px',
            borderRadius: '8px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '9px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '1.5px solid #0B0F1A',
          }}
        >
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export function MobileHeader({ title, showBack, onBack, leftAction, rightAction }: MobileHeaderProps) {
  return (
    <header className="mobile-header mobile-only safe-top">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        {leftAction && <ActionButton {...leftAction} />}
        {showBack && onBack ? (
          <button
            onClick={onBack}
            className="tap-highlight"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Geri"
          >
            <Icon name="arrow_back" style={{ fontSize: '20px', color: '#fff' }} />
          </button>
        ) : (
          <div style={{ width: '36px' }} /> // Spacer when no back button
        )}
        <h1
          style={{
            fontSize: '17px',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            flex: 1,
            textAlign: showBack ? 'left' : 'center',
            marginLeft: showBack ? '0' : '-36px', // Center when no back button
          }}
        >
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightAction && <ActionButton {...rightAction} />}
      </div>
    </header>
  );
}
