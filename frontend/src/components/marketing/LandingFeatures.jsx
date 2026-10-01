import React from 'react';
import { BarChart3, Check, Scissors, Sparkles } from 'lucide-react';
import { cx } from '../ui/cn';

const FEATURES = [
  {
    icon: BarChart3,
    eyebrow: 'Analytics intelligence',
    title: 'Know exactly why content performs',
    description:
      'Cross-channel reach, watch-time and retention curves in one view, with hook-level analysis attached to every asset.',
    bullets: ['Unified cross-platform metrics', 'Retention drop-off analysis', 'Platform-by-platform comparison'],
    tone: 'from-brand/20',
  },
  {
    icon: Sparkles,
    eyebrow: 'AI workspace',
    title: 'An operator that knows your channel',
    description:
      'The Strategist answers grounded in your real analytics, published library and Creator Brain memory — not generic advice.',
    bullets: ['Contextual 30-day planning', 'Ask-your-content search', 'Autonomous command terminal'],
    tone: 'from-cyan/20',
  },
  {
    icon: Scissors,
    eyebrow: 'Video lab',
    title: 'Turn one long video into a month of posts',
    description:
      'Transcribe footage, detect retention spikes and extract vertical clips, carousels and executive articles automatically.',
    bullets: ['Highlight detection', 'Viral-score ranking', 'Platform format translation'],
    tone: 'from-info/20',
  },
];

/** FeatureShowcase — three alternating feature bands with supporting detail. */
export function FeatureShowcase() {
  return (
    <section id="features" className="border-t border-line py-20">
      <div className="mx-auto max-w-6xl space-y-20 px-6">
        {FEATURES.map((feature, i) => (
          <div
            key={feature.title}
            className={cx('grid items-center gap-10 lg:grid-cols-2 lg:gap-16', i % 2 === 1 && 'lg:[&>*:first-child]:order-2')}
          >
            <div>
              <span className="cs-badge cs-badge-brand">{feature.eyebrow}</span>
              <h3 className="mt-3.5 text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-[30px]">
                {feature.title}
              </h3>
              <p className="mt-3.5 text-lead leading-relaxed text-ink-2">{feature.description}</p>
              <ul className="mt-6 space-y-2.5">
                {feature.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2.5 text-label text-ink-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-e2">
              <div
                className={cx('pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent', feature.tone)}
                aria-hidden="true"
              />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-ink-2">{feature.eyebrow}</span>
                  <span className="cs-badge cs-badge-neutral cs-badge-sm">Live</span>
                </div>
                <div className="cs-inset p-3">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-caption text-ink-3">Rolling 30-day performance</p>
                      <p className="text-[26px] font-bold text-ink">+24.6%</p>
                    </div>
                    <svg viewBox="0 0 120 40" className="h-10 w-28" aria-hidden="true">
                      <path
                        d="M0,34 C18,30 30,26 44,20 C60,13 78,10 120,3"
                        fill="none"
                        stroke="var(--cs-primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['Hooks', 'Retention', 'Revenue'].map((label) => (
                    <div key={label} className="cs-inset px-3 py-2.5">
                      <p className="text-caption text-ink-3">{label}</p>
                      <p className="text-label font-bold text-ink">Optimized</p>
                    </div>
                  ))}
                </div>
                <div className="cs-ai-surface rounded-xl p-3.5">
                  <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI recommendation
                  </p>
                  <p className="mt-1 text-caption text-ink-2">
                    Your step-by-step demonstrations hold 2.1x longer. Convert lesson three into a vertical short.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeatureShowcase;
