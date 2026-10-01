import React from 'react';
import { cx } from './cn';

const SIZES = { xs: 22, sm: 28, md: 36, lg: 48, xl: 64 };

const initialsOf = (name) =>
  String(name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

/** Avatar — user or brand identity mark with a deterministic initial fallback. */
export function Avatar({ src, name, size = 'md', status, ring = false, className = '' }) {
  const px = SIZES[size] || SIZES.md;
  const [broken, setBroken] = React.useState(false);
  const showImage = src && !broken;

  return (
    <span
      className={cx('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: px, height: px }}
    >
      <span
        className={cx(
          'flex h-full w-full items-center justify-center overflow-hidden rounded-pill border border-line bg-surface-2 font-semibold text-ink-2',
          ring && 'ring-2 ring-brand-ring'
        )}
        style={{ fontSize: Math.max(10, px * 0.38) }}
      >
        {showImage ? (
          <img src={src} alt={name || 'Avatar'} className="h-full w-full object-cover" onError={() => setBroken(true)} />
        ) : (
          initialsOf(name)
        )}
      </span>
      {status ? (
        <span
          className={cx(
            'absolute bottom-0 right-0 rounded-pill border-2',
            status === 'online' ? 'bg-success' : status === 'busy' ? 'bg-error' : 'bg-ink-3'
          )}
          style={{ width: Math.max(7, px * 0.27), height: Math.max(7, px * 0.27), borderColor: 'var(--cs-surface)' }}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

/** AvatarStack — overlapping team roster (max 4 visible + overflow count). */
export function AvatarStack({ people = [], max = 4, size = 'sm', className = '' }) {
  const visible = people.slice(0, max);
  const overflow = people.length - visible.length;

  return (
    <div className={cx('flex items-center', className)}>
      {visible.map((person, i) => (
        <span key={person.id || person.name || i} className={i > 0 ? '-ml-2' : ''}>
          <Avatar src={person.avatar} name={person.name} size={size} />
        </span>
      ))}
      {overflow > 0 ? (
        <span
          className="-ml-2 inline-flex items-center justify-center rounded-pill border border-line bg-surface-3 text-caption font-semibold text-ink-2"
          style={{ width: SIZES[size], height: SIZES[size] }}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

/** UserChip — avatar + name + meta, used in headers and bylines. */
export function UserChip({ name, meta, avatar, size = 'md', className = '' }) {
  return (
    <div className={cx('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar src={avatar} name={name} size={size === 'sm' ? 'sm' : 'md'} />
      <div className="min-w-0">
        <p className="truncate text-label font-semibold text-ink">{name}</p>
        {meta ? <p className="truncate text-caption text-ink-3">{meta}</p> : null}
      </div>
    </div>
  );
}

export default Avatar;
