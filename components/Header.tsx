import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack, leftAction, rightAction }) => {
  return (
    <header className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-md border-b border-slate-800 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
      <div className="flex items-center gap-3">
        {leftAction}
        {onBack && (
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-800 transition-colors active:scale-95"
          >
            <Icon name="arrow_back" className="text-slate-400" size={20} />
          </button>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      </div>
      {rightAction}
    </header>
  );
};