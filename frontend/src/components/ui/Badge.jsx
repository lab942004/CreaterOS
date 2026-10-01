import React from 'react';
import { cx } from './cn';

/** Semantic badge tones. Purple (brand) is never used to signal a state. */
const TONES = ['neutral', 'brand', 'success', 'warning', 'error', 'info', 'cyan', 'solid'];

export function Badge({ tone = 'neutral', size = 'md', dot = false, icon: Icon, className = '', children }) {
  const safeTone = TONES.includes(tone) ? tone : 'neutral';
  return (
    <span className={cx('cs-badge', `cs-badge-${safeTone}`, size === 'sm' && 'cs-badge-sm', className)}>
      {dot ? <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden="true" /> : null}
      {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

const STATUS_TONES = {
  PUBLISHED: 'success',
  ACTIVE: 'success',
  LIVE: 'success',
  READY: 'success',
  PAID: 'success',
  CONNECTED: 'success',
  SUCCESS: 'success',
  RUNNING: 'success',
  ANSWERED: 'success',
  VERIFIED: 'success',
  COMPLETED: 'success',
  SCHEDULED: 'info',
  PUBLISHING: 'info',
  REVIEW: 'info',
  IN_PROGRESS: 'info',
  DRAFT: 'neutral',
  PAUSED: 'neutral',
  ARCHIVED: 'neutral',
  PENDING: 'warning',
  DELAYED: 'warning',
  LEAD: 'warning',
  NEGOTIATION: 'warning',
  FAILED: 'error',
  ERROR: 'error',
  TOXIC: 'error',
  NEGATIVE: 'error',
  POSITIVE: 'success',
  NEUTRAL: 'neutral',
  TODO: 'neutral',
};

/** StatusBadge maps domain status strings onto the semantic colour system. */
export function StatusBadge({ status, size = 'md', className = '' }) {
  if (!status) return null;
  const key = String(status).toUpperCase().replace(/[\s-]+/g, '_');
  const tone = STATUS_TONES[key] || 'neutral';
  return (
    <Badge tone={tone} size={size} className={className}>
      {String(status).replace(/_/g, ' ')}
    </Badge>
  );
}

export default Badge;
