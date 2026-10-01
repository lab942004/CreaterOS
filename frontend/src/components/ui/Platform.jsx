import React from 'react';
import { cx } from './cn';

/* ---------------------------------------------------------------------------
   Platform identity
   Lucide intentionally ships no brand logos, so platform marks are declared
   here as first-party SVG glyphs in mid-tone brand colours that stay legible
   on both the dark and the light surface.
   --------------------------------------------------------------------------- */
export const PLATFORM_META = {
  YOUTUBE: { label: 'YouTube', color: '#FF2D55', glyph: 'play' },
  INSTAGRAM: { label: 'Instagram', color: '#E1306C', glyph: 'camera' },
  TIKTOK: { label: 'TikTok', color: '#06B6D4', glyph: 'note' },
  LINKEDIN: { label: 'LinkedIn', color: '#2C7BE5', glyph: 'in' },
  TWITTER: { label: 'X', color: '#64748B', glyph: 'x' },
  FACEBOOK: { label: 'Facebook', color: '#1877F2', glyph: 'f' },
};

export function platformLabel(platform) {
  if (!platform) return 'Unknown';
  return PLATFORM_META[String(platform).toUpperCase()]?.label || String(platform);
}

function Glyph({ glyph }) {
  switch (glyph) {
    case 'play':
      return <path d="M9.6 7.6 16 12l-6.4 4.4V7.6Z" fill="currentColor" />;
    case 'camera':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.7">
          <rect x="5" y="5" width="14" height="14" rx="4.4" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="16.4" cy="7.7" r="0.9" fill="currentColor" stroke="none" />
        </g>
      );
    case 'note':
      return (
        <g fill="currentColor">
          <path d="M14.6 5.2c.5.2.8.7.6 1.2l-.2.7c.9.5 1.6 1 2.1 1.5.4.4.5 1 .2 1.5a1.1 1.1 0 0 1-1.5.3c-.6-.4-1.2-.8-1.9-1.1l-1 3.7a3.4 3.4 0 1 1-1.6-1.5l.2-.7 1.6-5.1c.2-.5.7-.8 1.2-.6l.3.1Z" />
          <circle cx="10.2" cy="16.4" r="2.4" />
        </g>
      );
    case 'in':
      return (
        <g fill="currentColor">
          <rect x="5.4" y="9.6" width="2.6" height="8.4" rx="0.6" />
          <circle cx="6.7" cy="7" r="1.5" />
          <path d="M10.2 9.6h2.5v1.2c.5-.8 1.4-1.4 2.6-1.4 2 0 3.1 1.3 3.1 3.6v5h-2.6v-4.5c0-1.2-.5-1.9-1.5-1.9s-1.6.7-1.6 2v4.4h-2.5V9.6Z" />
        </g>
      );
    case 'x':
      return (
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M7.4 7.4 16.6 16.6" />
          <path d="M16.6 7.4 7.4 16.6" />
        </g>
      );
    case 'f':
      return (
        <path
          d="M13.6 21v-7.3h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.5-1.4h1.5V4.9c-.3 0-1.4-.1-2.5-.1-2.5 0-4.1 1.5-4.1 4v2h-2.5v2.9h2.5V21h3.6Z"
          fill="currentColor"
        />
      );
    default:
      return <circle cx="12" cy="12" r="4" fill="currentColor" />;
  }
}

/** PlatformMark — favicon-scale platform identity chip. */
export function PlatformMark({ platform, size = 22, className = '' }) {
  const meta = PLATFORM_META[String(platform || '').toUpperCase()];
  const color = meta?.color || 'var(--cs-ink-2)';
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-md', className)}
      style={{
        width: size,
        height: size,
        color,
        backgroundColor: `${color}22`,
        border: `1px solid ${color}33`,
      }}
      role="img"
      aria-label={platformLabel(platform)}
    >
      <svg viewBox="0 0 24 24" width={size * 0.68} height={size * 0.68} aria-hidden="true">
        <Glyph glyph={meta?.glyph} />
      </svg>
    </span>
  );
}

/** PlatformBadge — platform mark plus label, used in tables and card metadata. */
export function PlatformBadge({ platform, showLabel = true, size = 'md', className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface-2 py-0.5 pl-0.5 pr-2',
        size === 'sm' && 'pr-1.5',
        className
      )}
    >
      <PlatformMark platform={platform} size={size === 'sm' ? 18 : 20} />
      {showLabel ? (
        <span className="text-caption font-semibold text-ink-2">{platformLabel(platform)}</span>
      ) : null}
    </span>
  );
}

/** Tag — free-form taxonomy chip (#hashtags, content pillars, categories). */
export function Tag({ children, className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-sm bg-surface-2 px-2 py-0.5 text-caption font-medium text-ink-2',
        className
      )}
    >
      {children}
    </span>
  );
}

export default PlatformMark;
