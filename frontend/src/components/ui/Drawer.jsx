import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from './cn';
import { IconButton } from './Button';
import { useEscape, useLockBody } from './Modal';

const DRAWER_WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-xl',
};

/** Drawer — right-hand side sheet for secondary flows and mobile navigation. */
export function Drawer({ open, onClose, title, subtitle, footer, width = 'md', children }) {
  useLockBody(open);
  useEscape(open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm cs-anim-in" onClick={onClose} role="presentation" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        className={cx(
          'relative z-10 flex h-full w-full flex-col border-l border-line bg-surface shadow-e3 cs-anim-drawer',
          DRAWER_WIDTHS[width] || DRAWER_WIDTHS.md
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lead font-semibold text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-caption text-ink-3">{subtitle}</p> : null}
          </div>
          <IconButton label="Close panel" size="sm" icon={X} onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>
        ) : null}
      </aside>
    </div>,
    document.body
  );
}

/**
 * Menu — lightweight dropdown anchored to a trigger element.
 * `items`: [{ label, icon?, tone?, disabled?, onClick } | { divider: true }]
 */
export function Menu({ trigger, items = [], align = 'right', className = '' }) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const escape = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className={cx('relative', className)} ref={ref}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center"
      >
        {trigger}
      </button>
      {open ? (
        <div
          role="menu"
          className={cx(
            'absolute z-50 mt-2 min-w-[190px] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-e3 cs-anim-scale',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`divider-${i}`} className="my-1 border-t border-line" role="separator" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
                className={cx(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-label font-medium transition-colors',
                  item.tone === 'danger'
                    ? 'text-error hover:bg-error/10'
                    : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  item.disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {item.icon ? <item.icon className="h-4 w-4" aria-hidden="true" /> : null}
                {item.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

export default Drawer;
