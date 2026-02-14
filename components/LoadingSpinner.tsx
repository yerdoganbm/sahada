import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'text-primary',
  fullScreen = false,
  message
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}></div>
      {message && (
        <p className="text-sm text-slate-400 animate-pulse">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/95 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Inline kullanım için küçük spinner
export const SpinnerInline: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ${className}`}></div>
);
