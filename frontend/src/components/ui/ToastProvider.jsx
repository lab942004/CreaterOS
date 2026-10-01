import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from 'lucide-react';
import { cx } from './cn';

const ToastContext = createContext({ toast: () => {}, dismiss: () => {} });

const TONES = {
  success: { Icon: CheckCircle2, cls: 'border-success/30 text-success' },
  error: { Icon: AlertTriangle, cls: 'border-error/30 text-error' },
  warning: { Icon: AlertTriangle, cls: 'border-warning/30 text-warning' },
  info: { Icon: Info, cls: 'border-info/30 text-info' },
  ai: { Icon: Sparkles, cls: 'border-brand-ring text-brand' },
};

/** ToastProvider — transient feedback for mutations and AI job completion. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, tone = 'success', duration = 4200 }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, title, description, tone }]);
      if (duration) window.setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const { Icon, cls } = TONES[t.tone] || TONES.info;
          return (
            <div
              key={t.id}
              className={cx(
                'pointer-events-auto flex items-start gap-3 rounded-xl border bg-surface px-4 py-3 shadow-e3 cs-anim-drawer',
                cls
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {t.title ? <p className="text-label font-semibold text-ink">{t.title}</p> : null}
                {t.description ? <p className="mt-0.5 text-caption text-ink-2">{t.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export default ToastProvider;
