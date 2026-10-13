import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { ToastType } from '../types';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
        };
      case 'warning':
        return {
          bg: 'bg-amber-600 text-white',
          icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-600 text-white',
          icon: <AlertCircle className="w-4 h-4 shrink-0" />,
        };
      case 'info':
      default:
        return {
          bg: 'bg-zinc-800 text-white dark:bg-zinc-700',
          icon: <Info className="w-4 h-4 shrink-0" />,
        };
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-xs w-full px-2 sm:px-0">
      {toasts.map((toast) => {
        const { bg, icon } = getStyle(toast.type);
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 animate-fade-in text-xs font-semibold ${bg}`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <span className="leading-snug">{toast.text}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
