import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cx } from '../ui/cn';

/** StepHeading — shared title block inside every onboarding step body. */
export function StepHeading({ title, description }) {
  return (
    <div className="space-y-1.5">
      <h2 className="text-[22px] font-bold tracking-tight text-ink">{title}</h2>
      {description ? <p className="text-label leading-relaxed text-ink-2">{description}</p> : null}
    </div>
  );
}

/** OptionGrid — single- or multi-select card grid used across the setup steps. */
export function OptionGrid({ options, value, onChange, multiple = false, columns = 2 }) {
  const selected = multiple ? value || [] : [value];
  const isSelected = (val) => selected.includes(val);

  const toggle = (val) => {
    if (!multiple) {
      onChange?.(val);
      return;
    }
    const next = isSelected(val) ? selected.filter((v) => v !== val) : [...selected, val];
    onChange?.(next);
  };

  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const key = option.value ?? option.label;
        const active = isSelected(key);
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(key)}
            className={cx(
              'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200',
              active ? 'border-brand-ring bg-brand-soft' : 'border-line bg-surface-2 hover:border-brand-ring hover:bg-surface-3'
            )}
          >
            {option.icon ? (
              <span
                className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  active ? 'bg-brand text-white' : 'bg-surface-3 text-ink-3'
                )}
              >
                <option.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-label font-semibold text-ink">{option.label}</span>
                {active && multiple ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                ) : null}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-caption leading-relaxed text-ink-3">{option.description}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
