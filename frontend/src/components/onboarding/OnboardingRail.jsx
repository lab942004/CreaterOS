import React from 'react';
import { ArrowLeft, ArrowRight, Check, Rocket } from 'lucide-react';
import { cx } from '../ui/cn';
import { Logo } from '../ui/Logo';

/** OnboardingRail — progress rail listing all ten activation steps. */
export function OnboardingRail({ steps, current }) {
  const progress = Math.round((current / steps.length) * 100);

  return (
    <aside className="relative hidden w-[300px] shrink-0 flex-col border-r border-line bg-app-2 p-6 lg:flex">
      <div className="pointer-events-none absolute inset-0 cs-aurora opacity-60" aria-hidden="true" />

      <div className="relative">
        <Logo size={32} />
      </div>

      <div className="relative mt-8">
        <div className="flex items-center justify-between text-caption">
          <span className="font-semibold text-ink">Setup progress</span>
          <span className="font-semibold text-ink-3">{progress}%</span>
        </div>
        <div className="cs-progress-track mt-2">
          <div className="cs-progress-fill transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <ol className="relative mt-7 flex-1 space-y-1">
        {steps.map((item) => {
          const complete = item.id < current;
          const active = item.id === current;
          return (
            <li key={item.id} className="flex items-center gap-3">
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-caption font-bold',
                  complete ? 'bg-success/15 text-success' : active ? 'bg-brand text-white' : 'bg-surface-3 text-ink-3'
                )}
              >
                {complete ? <Check className="h-3 w-3" aria-hidden="true" /> : item.id}
              </span>
              <span className={cx('text-label', active ? 'font-semibold text-ink' : complete ? 'text-ink-2' : 'text-ink-3')}>
                {item.label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="relative cs-ai-surface rounded-xl p-3.5">
        <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
          <Rocket className="h-3.5 w-3.5" aria-hidden="true" /> Why we ask
        </p>
        <p className="mt-1 text-caption leading-relaxed text-ink-2">
          These answers become your Creator Brain — the ground truth every AI output is measured against.
        </p>
      </div>
    </aside>
  );
}

/** OnboardingFooter — step navigation with progress on small viewports. */
export function OnboardingFooter({ step, total, progress, onBack, onNext, saving, nextDisabled, nextLabel }) {
  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-4 lg:px-8">
      <div className="flex items-center gap-3 text-caption text-ink-3 lg:hidden">
        <span className="font-semibold text-ink">
          {step}/{total}
        </span>
        <span className="cs-progress-track w-24">
          <span className="cs-progress-fill block" style={{ width: `${progress}%` }} />
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {step > 1 ? (
          <button type="button" onClick={onBack} className="cs-btn cs-btn-ghost cs-btn-md" disabled={saving}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>
        ) : null}
        <button type="button" onClick={onNext} disabled={saving || nextDisabled} className="cs-btn cs-btn-ai cs-btn-md">
          {nextLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
