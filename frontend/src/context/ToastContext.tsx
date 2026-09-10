import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const styles: Record<ToastKind, { box: string; Icon: typeof Info }> = {
  success: { box: 'bg-green-50 border-green-200 text-green-800', Icon: CheckCircle2 },
  error: { box: 'bg-red-50 border-red-200 text-red-800', Icon: AlertCircle },
  info: { box: 'bg-blue-50 border-blue-200 text-blue-800', Icon: Info },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 6000 : 3500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextType>(
    () => ({
      showToast,
      success: (m) => showToast(m, 'success'),
      error: (m) => showToast(m, 'error'),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const { box, Icon } = styles[t.kind];
          return (
            <div key={t.id} role="status" className={`flex items-start gap-2 p-3 rounded-lg border shadow-md text-sm ${box}`}>
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="p-0.5 rounded hover:bg-black/5" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
