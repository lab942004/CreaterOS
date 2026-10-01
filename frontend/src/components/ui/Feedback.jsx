import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles, XCircle } from 'lucide-react';
import { cx } from './cn';

/** Skeleton — layout-preserving loading placeholder. */
export function Skeleton({ className = '', style }) {
  return <div className={cx('cs-skeleton', className)} style={style} aria-hidden="true" />;
}

export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={cx('cs-card space-y-3 p-5', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

/** PageLoader — consistent first-paint state for async screens. */
export function PageLoader({ label = 'Loading workspace…', className = '' }) {
  return (
    <div className={cx('flex min-h-[320px] flex-col items-center justify-center gap-3 text-ink-3', className)}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Sparkles className="h-5 w-5 animate-pulse" aria-hidden="true" />
      </span>
      <p className="text-caption font-medium">{label}</p>
    </div>
  );
}

/** Alert — inline messaging for info / success / warning / error / AI. */
export function Alert({ tone = 'info', title, children, action, icon, className = '' }) {
  const map = {
    info: { Icon: icon || Info, cls: 'border-info/30 bg-info/10 text-info' },
    success: { Icon: icon || CheckCircle2, cls: 'border-success/30 bg-success/10 text-success' },
    warning: { Icon: icon || AlertTriangle, cls: 'border-warning/30 bg-warning/10 text-warning' },
    error: { Icon: icon || XCircle, cls: 'border-error/30 bg-error/10 text-error' },
    ai: { Icon: icon || Sparkles, cls: 'border-brand-ring bg-brand-soft text-brand' },
  };
  const resolved = map[tone] || map.info;
  const Icon = resolved.Icon;

  return (
    <div className={cx('flex items-start gap-3 rounded-lg border px-4 py-3', resolved.cls, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="text-label font-semibold">{title}</p> : null}
        {children ? <div className="text-caption text-ink-2">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * AIInsight — the product's signature AI surface.
 * Violet glow + sparkle affordance + optional confidence score.
 */
export function AIInsight({ title, children, confidence, action, compact = false, className = '' }) {
  return (
    <div className={cx('cs-ai-surface relative overflow-hidden rounded-xl', compact ? 'p-3.5' : 'p-4', className)}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg cs-gradient-brand text-white shadow-glow">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {title ? <h4 className="text-label font-semibold text-ink">{title}</h4> : null}
            {typeof confidence === 'number' ? (
              <span className="cs-badge cs-badge-brand cs-badge-sm">{confidence}% confidence</span>
            ) : null}
          </div>
          {children ? <div className="mt-1 text-caption leading-relaxed text-ink-2">{children}</div> : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default Alert;
