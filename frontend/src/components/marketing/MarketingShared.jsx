import React from 'react';
import { cx } from '../ui/cn';

/** SectionHeading — consistent marketing section anatomy. */
export function SectionHeading({ eyebrow, title, description, align = 'center', className = '' }) {
  return (
    <div className={cx('max-w-2xl', align === 'center' ? 'mx-auto text-center' : 'text-left', className)}>
      {eyebrow ? <span className="cs-badge cs-badge-brand mb-3">{eyebrow}</span> : null}
      <h2 className="text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[34px]">{title}</h2>
      {description ? <p className="mt-3.5 text-lead text-ink-2">{description}</p> : null}
    </div>
  );
}

/** Aurora colour wash — used behind the hero and closing CTA. */
export function AuroraBackdrop({ className = '' }) {
  return <div className={cx('pointer-events-none absolute inset-0 cs-aurora', className)} aria-hidden="true" />;
}

/** Faint technical grid — reinforces the "operating system" metaphor. */
export function GridBackdrop({ className = '' }) {
  return (
    <div
      className={cx(
        'pointer-events-none absolute inset-0 cs-grid-overlay [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]',
        className
      )}
      aria-hidden="true"
    />
  );
}

/** FloatingMetric — small glass stat chip used around the hero mock. */
export function FloatingMetric({ label, value, delta, icon: Icon, className = '' }) {
  return (
    <div
      className={cx(
        'flex items-center gap-3 rounded-xl border border-line px-3.5 py-2.5 shadow-e2 backdrop-blur-xl cs-glass',
        className
      )}
    >
      {Icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <p className="text-caption text-ink-3">{label}</p>
        <p className="text-label font-bold text-ink">
          {value}
          {delta ? <span className="ml-1.5 text-caption font-semibold text-success">{delta}</span> : null}
        </p>
      </div>
    </div>
  );
}

export default SectionHeading;
