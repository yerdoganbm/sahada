/**
 * ProviderBadge — Shows LIVE / DEMO mode indicator
 */
import React from 'react';

interface ProviderBadgeProps {
  mode?: 'firebase' | 'mock';
  className?: string;
}

export const ProviderBadge: React.FC<ProviderBadgeProps> = ({ mode = 'mock', className = '' }) => {
  const isLive = mode === 'firebase';
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${className}`}
      style={{
        background: isLive ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
        border: isLive ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(245,158,11,0.2)',
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isLive ? 'animate-pulse' : ''}`}
        style={{ background: isLive ? '#10B981' : '#F59E0B' }}
      />
      <span
        className="text-[8px] font-black uppercase tracking-widest"
        style={{ color: isLive ? '#10B981' : '#F59E0B' }}
      >
        {isLive ? 'LIVE' : 'DEMO'}
      </span>
    </div>
  );
};
