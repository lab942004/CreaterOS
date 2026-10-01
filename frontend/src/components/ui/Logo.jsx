import React from 'react';
import { cx } from './cn';

/**
 * Brand mark. The purple gradient tile is the product's identity anchor and
 * appears identically in the sidebar, auth screens and marketing header.
 */
export function LogoMark({ size = 36, className = '' }) {
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-xl cs-gradient-brand font-extrabold text-white shadow-glow', className)}
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      aria-hidden="true"
    >
      C
    </span>
  );
}

export function Logo({ size = 36, showTagline = true, tagline = 'AI Operating System', className = '' }) {
  return (
    <span className={cx('flex items-center gap-3', className)}>
      <LogoMark size={size} />
      <span className="min-w-0">
        <span className="block text-lead font-extrabold leading-none tracking-tight text-ink">
          CREATOR<span className="text-brand">OS</span>
        </span>
        {showTagline ? (
          <span className="mt-1 block text-caption font-medium uppercase tracking-[0.14em] text-ink-3">{tagline}</span>
        ) : null}
      </span>
    </span>
  );
}

export default Logo;
