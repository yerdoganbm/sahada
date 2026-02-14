import React, { createContext, useContext, useState, useCallback } from 'react';
import { Icon } from './Icon';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const value = { showToast, success, error, warning, info };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({
  toasts,
  onRemove
}) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({
  toast,
  onRemove
}) => {
  const { type, message, id } = toast;

  const typeConfig = {
    success: {
      bg: 'bg-green-500',
      icon: 'check_circle',
      textColor: 'text-white'
    },
    error: {
      bg: 'bg-red-500',
      icon: 'error',
      textColor: 'text-white'
    },
    warning: {
      bg: 'bg-yellow-500',
      icon: 'warning',
      textColor: 'text-white'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'info',
      textColor: 'text-white'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${config.bg} ${config.textColor} px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[280px] max-w-md pointer-events-auto animate-slide-in-right`}
      onClick={() => onRemove(id)}
    >
      <Icon name={config.icon} size={20} filled />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(id);
        }}
        className="hover:bg-white/20 rounded-full p-1 transition-colors"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  );
};
