import React from 'react';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, rightAction }) => {
  return (
    <header className="sticky top-0 z-40 bg-secondary/80 backdrop-blur-md border-b border-slate-800 px-4 pt-4 pb-3 flex justify-between items-center safe-top">
      <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
      {rightAction || (
        <button className="p-2 rounded-full hover:bg-slate-800 transition-colors">
          <Icon name="notifications" className="text-slate-400" />
        </button>
      )}
    </header>
  );
};