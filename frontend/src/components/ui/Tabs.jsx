import React from 'react';
import { cx } from './cn';

/**
 * Tabs — router-agnostic segmented navigation.
 * `items`: [{ id, label, icon?, count? }]
 */
export function Tabs({ items = [], value, onChange, variant = 'rail', className = '' }) {
  const isUnderline = variant === 'underline';

  return (
    <div className={cx(isUnderline ? 'flex items-center gap-1 border-b border-line' : 'cs-tab-rail', className)} role="tablist">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(item.id)}
            className={cx(
              isUnderline
                ? 'relative -mb-px inline-flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-label font-medium transition-colors'
                : 'cs-tab',
              active
                ? isUnderline
                  ? 'border-brand text-ink'
                  : 'cs-tab-active'
                : isUnderline
                  ? 'border-transparent text-ink-2 hover:text-ink'
                  : ''
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            {item.label}
            {item.count !== undefined ? (
              <span className="cs-badge cs-badge-neutral cs-badge-sm tabular-nums">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * SegmentedControl — compact filter switching (timeframes, view modes).
 * `options`: [{ value, label }]
 */
export function SegmentedControl({ options = [], value, onChange, className = '' }) {
  return (
    <div className={cx('cs-tab-rail', className)} role="group">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(opt.value)}
            className={cx(
              'rounded-md px-3 py-1.5 text-caption font-semibold transition-all',
              active ? 'bg-surface text-brand shadow-e1' : 'text-ink-2 hover:text-ink'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
