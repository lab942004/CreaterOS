import React from 'react';
import { cx } from './cn';

const TONE_STROKE = {
  brand: 'var(--cs-primary)',
  success: 'var(--cs-success)',
  warning: 'var(--cs-warning)',
  error: 'var(--cs-error)',
  info: 'var(--cs-info)',
  cyan: 'var(--cs-cyan)',
};

const TONE_FILL = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  cyan: 'bg-cyan',
};

/** ProgressRing — circular completion indicator (DNA scores, quota usage). */
export function ProgressRing({ value = 0, size = 96, thickness = 8, tone = 'brand', label, sublabel, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div
      className={cx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--cs-surface-3)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone] || TONE_STROKE.brand}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms var(--ease-out)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-title font-bold text-ink">{label ?? `${Math.round(pct)}`}</span>
        {sublabel ? <span className="text-caption text-ink-3">{sublabel}</span> : null}
      </div>
    </div>
  );
}

/** ProgressBar — linear progress with an optional accessible label. */
export function ProgressBar({ value = 0, tone = 'brand', label, hint, className = '' }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cx('space-y-1.5', className)}>
      {label || hint ? (
        <div className="flex items-center justify-between text-caption">
          <span className="font-medium text-ink-2">{label}</span>
          <span className="font-semibold text-ink-3">{hint ?? `${Math.round(pct)}%`}</span>
        </div>
      ) : null}
      <div className="cs-progress-track">
        <div className={cx('cs-progress-fill', TONE_FILL[tone] || TONE_FILL.brand)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** MetricGrid — compact labelled figure cluster (engagement, video stats). */
export function MetricGrid({ items = [], columns = 2, className = '' }) {
  return (
    <div
      className={cx('grid gap-3', className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div key={item.label} className="cs-inset px-3 py-2.5">
          <span className="block text-caption text-ink-3">{item.label}</span>
          <span className="mt-0.5 block text-lead font-bold text-ink">{item.value}</span>
          {item.hint ? <span className="mt-0.5 block text-caption text-ink-3">{item.hint}</span> : null}
        </div>
      ))}
    </div>
  );
}

/** StatRow — label / value / share bar, used for demographic breakdowns. */
export function StatRow({ label, value, percent, tone = 'brand', className = '' }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-3 text-caption">
        <span className="font-medium text-ink-2">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      {typeof percent === 'number' ? <ProgressBar value={percent} tone={tone} /> : null}
    </div>
  );
}

export default ProgressRing;
