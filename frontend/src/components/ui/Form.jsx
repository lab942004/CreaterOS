import React from 'react';
import { ChevronDown, Search, UploadCloud, AlertCircle } from 'lucide-react';
import { cx } from './cn';

/** Field — label + control + hint/error wrapper. One form rhythm everywhere. */
export function Field({ label, htmlFor, hint, error, required = false, action, className = '', children }) {
  return (
    <div className={cx('space-y-0', className)}>
      {label || action ? (
        <div className="flex items-center justify-between gap-3">
          <label className="cs-label" htmlFor={htmlFor}>
            {label}
            {required ? <span className="ml-0.5 text-error">*</span> : null}
          </label>
          {action}
        </div>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-caption font-medium text-error">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-caption text-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ icon: Icon, className = '', invalid = false, ...rest }) {
  if (!Icon) {
    return <input className={cx('cs-input', invalid && 'border-error', className)} {...rest} />;
  }
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <input className={cx('cs-input cs-input-affix', invalid && 'border-error', className)} {...rest} />
    </div>
  );
}

export function TextArea({ className = '', invalid = false, ...rest }) {
  return <textarea className={cx('cs-textarea', invalid && 'border-error', className)} {...rest} />;
}

/** Select — native select styled with the design system chevron affordance. */
export function Select({ className = '', children, ...rest }) {
  return (
    <div className="relative">
      <select className={cx('cs-select', className)} {...rest}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
        aria-hidden="true"
      />
    </div>
  );
}

export function SearchInput({ className = '', wrapperClassName = '', ...rest }) {
  return (
    <div className={cx('relative', wrapperClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <input type="search" className={cx('cs-input cs-input-affix', className)} {...rest} />
    </div>
  );
}

/** Toggle — accessible switch for boolean settings and autopilot rules. */
export function Toggle({ checked = false, onChange, label, description, disabled = false, className = '' }) {
  const id = React.useId();
  return (
    <div className={cx('flex items-start justify-between gap-4', className)}>
      {label || description ? (
        <div className="min-w-0">
          <label htmlFor={id} className="block text-label font-semibold text-ink">
            {label}
          </label>
          {description ? <p className="mt-0.5 text-caption text-ink-3">{description}</p> : null}
        </div>
      ) : null}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-pill border transition-colors duration-200',
          checked ? 'border-transparent bg-brand' : 'border-line-2 bg-surface-3',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cx(
            'inline-block h-4.5 w-4.5 rounded-pill bg-white shadow-e1 transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
          )}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </div>
  );
}

/** UploadZone — drag/drop affordance used by Video Lab and content import. */
export function UploadZone({ title, hint, accept, onFiles, icon: Icon = UploadCloud, className = '' }) {
  const inputRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFiles = (files) => {
    if (files?.length) onFiles?.([...files]);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={cx(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-colors',
        dragging ? 'border-brand bg-brand-soft' : 'border-line-2 bg-surface-2 hover:border-brand-ring',
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-label font-semibold text-ink">{title || 'Drop files to upload'}</span>
      {hint ? <span className="text-caption text-ink-3">{hint}</span> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

export default Input;
