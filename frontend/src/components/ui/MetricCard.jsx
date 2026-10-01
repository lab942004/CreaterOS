import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cx } from './cn';
import { Card } from './Card';

/** DeltaPill — growth / decline indicator. Green up, red down, neutral flat. */
export function DeltaPill({ value, suffix = '%', direction, tone, className = '' }) {
  const numeric = typeof value === 'number' ? value : parseFloat(value);
  const hasNumber = Number.isFinite(numeric);
  const dir = direction || (hasNumber ? (numeric > 0 ? 'up' : numeric < 0 ? 'down' : 'flat') : 'flat');
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus;
  const resolvedTone = tone || (dir === 'up' ? 'success' : dir === 'down' ? 'error' : 'neutral');

  const toneClass = {
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
    neutral: 'text-ink-3',
    info: 'text-info',
  }[resolvedTone];

  const display = hasNumber
    ? `${numeric > 0 ? '+' : ''}${numeric}${suffix}`
    : typeof value === 'string'
      ? value
      : '';

  return (
    <span className={cx('inline-flex items-center gap-0.5 text-caption font-semibold', toneClass, className)}>
      {dir !== 'flat' ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {display}
    </span>
  );
}

/**
 * Sparkline — dependency-free inline trend line.
 * Keeps micro-charts crisp without mounting the charting library.
 */
export function Sparkline({ data = [], width = 96, height = 30, tone = 'brand', filled = true, className = '' }) {
  const values = data.filter((n) => Number.isFinite(n));
  if (values.length < 2) return <div className={cx('h-[30px]', className)} aria-hidden="true" />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values.map((v, i) => [i * stepX, height - ((v - min) / span) * (height - 4) - 2]);
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;

  const stroke =
    {
      brand: 'var(--cs-primary)',
      success: 'var(--cs-success)',
      warning: 'var(--cs-warning)',
      error: 'var(--cs-error)',
      info: 'var(--cs-info)',
      cyan: 'var(--cs-cyan)',
    }[tone] || 'var(--cs-primary)';

  const gradientId = `cs-spark-${tone}`;

  return (
    <svg
      className={cx('overflow-visible', className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {filled ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * MetricCard — the primary KPI primitive.
 * One consistent anatomy for every number in the product: label, value,
 * delta, optional mini-visualisation and optional AI annotation.
 */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  deltaSuffix = '%',
  deltaDirection,
  caption,
  icon: Icon,
  trend,
  tone = 'brand',
  ai = false,
  className = '',
}) {
  const toneClass =
    {
      brand: 'text-brand bg-brand-soft',
      success: 'text-success bg-success/10',
      warning: 'text-warning bg-warning/10',
      error: 'text-error bg-error/10',
      info: 'text-info bg-info/10',
      cyan: 'text-cyan bg-cyan/10',
    }[tone] || 'text-brand bg-brand-soft';

  return (
    <Card hover className={cx('relative overflow-hidden p-5', ai && 'cs-ai-surface', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-caption font-medium text-ink-2">{label}</span>
        {Icon ? (
          <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg', toneClass)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-end gap-1.5">
        <span className="text-display font-bold tracking-tight text-ink">{value}</span>
        {unit ? <span className="pb-1 text-caption font-medium text-ink-3">{unit}</span> : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {delta !== undefined && delta !== null ? (
            <DeltaPill value={delta} suffix={deltaSuffix} direction={deltaDirection} />
          ) : null}
          {caption ? <span className="truncate text-caption text-ink-3">{caption}</span> : null}
        </div>
        {trend?.length ? <Sparkline data={trend} tone={tone} width={72} height={26} /> : null}
      </div>
    </Card>
  );
}

export default MetricCard;
