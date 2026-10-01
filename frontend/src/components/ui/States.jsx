import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';
import { cx } from './cn';
import { Button } from './Button';

/** EmptyState — for zero-data routes; never leave a screen blank. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-ink-3">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="text-label font-semibold text-ink">{title}</h3>
        {description ? <p className="text-caption text-ink-3">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

/** ErrorState — recoverable failure surface with a retry affordance. */
export function ErrorState({ title = 'Something went wrong', description, onRetry, className = '' }) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 px-6 py-14 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-error/10 text-error">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="text-label font-semibold text-ink">{title}</h3>
        {description ? <p className="text-caption text-ink-3">{description}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
