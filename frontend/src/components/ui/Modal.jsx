import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './cn';
import { Button, IconButton } from './Button';

/** Shared overlay behaviour: scroll lock + escape-to-dismiss. */
export function useLockBody(active) {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

export function useEscape(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/** Modal — centered dialog for forms, confirmations and detail previews. */
export function Modal({ open, onClose, title, subtitle, icon: Icon, footer, size = 'md', className = '', children }) {
  useLockBody(open);
  useEscape(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm cs-anim-in" onClick={onClose} role="presentation" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={cx(
          'relative z-10 w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-e3 cs-anim-sheet',
          MODAL_SIZES[size] || MODAL_SIZES.md,
          className
        )}
      >
        {title ? (
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="flex min-w-0 items-start gap-3">
              {Icon ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              ) : null}
              <div className="min-w-0">
                <h2 className="text-lead font-semibold text-ink">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-caption text-ink-3">{subtitle}</p> : null}
              </div>
            </div>
            <IconButton label="Close dialog" size="sm" icon={X} onClick={onClose} />
          </div>
        ) : null}

        <div className="max-h-[70vh] overflow-y-auto p-5">{children}</div>

        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

/** ConfirmDialog — explicit confirmation for destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Please confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone} size="sm" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-label text-ink-2">{description}</p>
    </Modal>
  );
}

export default Modal;
