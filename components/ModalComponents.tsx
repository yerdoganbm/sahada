import React, { useEffect, useState } from 'react';
import { useModalScrollLock } from '../hooks/useIOSScrollFix';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * iOS Safari Uyumlu Modal Component
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  useModalScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="modal-container">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
          >
            {title && (
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 id="modal-title" className="text-xl font-bold text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Kapat"
                >
                  <span className="material-icons-round text-slate-400">close</span>
                </button>
              </div>
            )}
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollable-area">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: string[];
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = ['90%']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [startY, setStartY] = useState(0);

  useModalScrollLock(isOpen);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) setDragY(diff);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragY > 100) onClose();
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="drawer-container">
        <div className="flex items-end justify-center min-h-screen">
          <div
            className="bg-surface rounded-t-3xl w-full relative transition-transform"
            style={{
              height: snapPoints[0],
              transform: `translateY(${dragY}px)`,
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'drawer-title' : undefined}
          >
            <div
              className="py-3 flex justify-center cursor-grab active:cursor-grabbing"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1 bg-slate-600 rounded-full" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-6 pb-4 border-b border-white/10">
                <h2 id="drawer-title" className="text-xl font-bold text-white">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Kapat"
                >
                  <span className="material-icons-round text-slate-400">close</span>
                </button>
              </div>
            )}
            <div className="px-6 py-4 overflow-y-auto scrollable-area" style={{ maxHeight: 'calc(100% - 80px)' }}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="modal-container bg-secondary">
      <div className="sticky top-0 left-0 right-0 z-10 bg-secondary border-b border-white/10">
        <div className="flex items-center justify-between p-4 safe-top">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Geri"
          >
            <span className="material-icons-round text-white">arrow_back</span>
          </button>
          {title && (
            <h1 className="text-lg font-bold text-white flex-1 text-center">
              {title}
            </h1>
          )}
          <div className="w-10" />
        </div>
      </div>
      <div className="overflow-y-auto scrollable-area safe-bottom" style={{ height: 'calc(100vh - 64px)' }}>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};
