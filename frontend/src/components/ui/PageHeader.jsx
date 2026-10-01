import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cx } from './cn';

/**
 * PageHeader — the single opening anatomy for every screen in the product:
 * eyebrow, title, subtitle, icon, primary action and an optional tab rail.
 */
export function PageHeader({ eyebrow, title, subtitle, icon: Icon, action, tabs, className = '' }) {
  return (
    <header className={cx('flex flex-col gap-4', className)}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 items-start gap-3.5">
          {Icon ? (
            <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl cs-gradient-brand text-white shadow-glow">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            {eyebrow ? <p className="cs-eyebrow">{eyebrow}</p> : null}
            <h1 className="mt-0.5 text-heading font-bold tracking-tight text-ink">{title}</h1>
            {subtitle ? <p className="mt-1 text-label text-ink-2">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {tabs}
    </header>
  );
}

/** BackLink — router-aware return affordance for detail screens. */
export function BackLink({ to, children = 'Back', className = '' }) {
  return (
    <NavLink
      to={to}
      className={cx(
        'inline-flex items-center gap-1.5 text-caption font-semibold text-ink-3 transition-colors hover:text-ink',
        className
      )}
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </NavLink>
  );
}

export default PageHeader;

