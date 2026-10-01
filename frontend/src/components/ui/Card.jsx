import React from 'react';
import { cx } from './cn';

/**
 * Card surfaces. Every panel in the product is built from these so radius,
 * border and shadow stay identical across all screens.
 */
export function Card({ as: Tag = 'div', hover = false, className = '', children, ...rest }) {
  return (
    <Tag className={cx('cs-card', hover && 'cs-card-hover', className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, children, className = '' }) {
  return (
    <div className={cx('flex items-start justify-between gap-4 px-5 py-4 border-b border-line', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        ) : null}
        <div className="min-w-0">
          {title ? <h3 className="text-label font-semibold text-ink truncate">{title}</h3> : null}
          {subtitle ? <p className="mt-0.5 text-caption text-ink-3">{subtitle}</p> : null}
          {children}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={cx('p-5', className)}>{children}</div>;
}

export function CardFooter({ className = '', children }) {
  return (
    <div className={cx('flex items-center justify-between gap-3 border-t border-line px-5 py-3.5', className)}>
      {children}
    </div>
  );
}

/**
 * SectionCard — the workhorse panel: header + body + optional footer.
 * Used for every dashboard/analytics section to guarantee visual rhythm.
 */
export function SectionCard({
  title,
  subtitle,
  icon,
  action,
  footer,
  hover = false,
  className = '',
  bodyClassName = '',
  children,
}) {
  return (
    <Card hover={hover} className={cx('flex flex-col overflow-hidden', className)}>
      {title || action ? <CardHeader title={title} subtitle={subtitle} icon={icon} action={action} /> : null}
      <CardBody className={cx('flex-1', bodyClassName)}>{children}</CardBody>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

/** ChartCard — a SectionCard tuned for Recharts/visualisation content. */
export function ChartCard({
  title,
  subtitle,
  icon,
  action,
  legend,
  height = 280,
  className = '',
  children,
}) {
  return (
    <Card className={cx('flex flex-col overflow-hidden', className)}>
      {(title || action || legend) && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          icon={icon}
          action={
            <>
              {legend}
              {action}
            </>
          }
        />
      )}
      <CardBody className="pt-4">
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardBody>
    </Card>
  );
}

/** Compact stat row used inside dense panels (audience splits, device mixes). */
export function StatRow({ label, value, percent, tone = 'brand', className = '' }) {
  const toneClass = {
    brand: 'bg-brand',
    cyan: 'bg-cyan',
    success: 'bg-success',
    warning: 'bg-warning',
    info: 'bg-info',
  }[tone] || 'bg-brand';

  return (
    <div className={cx('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-3 text-caption">
        <span className="font-medium text-ink-2">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      {typeof percent === 'number' ? (
        <div className="cs-progress-track">
          <div className={cx('cs-progress-fill', toneClass)} style={{ width: `${Math.min(percent, 100)}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export default Card;
