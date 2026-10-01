import React from 'react';
import { cx } from '../ui/cn';
import { LogoMark } from '../ui/Logo';

/**
 * ProductPreview — a stylised rendering of the CreatorOS workspace used as the
 * hero visual. Built from the same design tokens as the real product so the
 * marketing surface and the app never drift apart.
 */
const KPIS = [
  { label: 'Total Views', value: '2.41M', delta: '+18.2%' },
  { label: 'Audience', value: '906.9K', delta: '+34.4K' },
  { label: 'Engagement', value: '11.4%', delta: '2.4x avg' },
  { label: 'Revenue', value: '$35.5K', delta: '+12.1%' },
];

const TOP_ROWS = [
  { title: 'The Solopreneur AI Stack', platform: 'YouTube', metric: '412K views', tone: 'bg-brand' },
  { title: 'Autonomous Agents Explained', platform: 'TikTok', metric: '188K views', tone: 'bg-cyan' },
  { title: 'Local LLMs, Honestly', platform: 'LinkedIn', metric: '96K views', tone: 'bg-info' },
];

const NAV_ITEMS = ['Dashboard', 'Analytics', 'Content', 'AI Workspace', 'Calendar', 'Video Lab', 'Revenue'];

export default function ProductPreview({ className = '' }) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-2xl border border-line shadow-e3 backdrop-blur-xl cs-glass',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-pill bg-error/70" />
        <span className="h-2.5 w-2.5 rounded-pill bg-warning/70" />
        <span className="h-2.5 w-2.5 rounded-pill bg-success/70" />
        <span className="ml-3 flex-1 truncate rounded-sm bg-surface-2 px-2.5 py-1 text-[11px] text-ink-3">
          app.creatoros.ai/dashboard
        </span>
      </div>

      <div className="flex">
        <div className="hidden w-[116px] shrink-0 space-y-1.5 border-r border-line p-3 sm:block">
          <div className="mb-3 flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-[10px] font-bold text-ink">CREATOROS</span>
          </div>
          {NAV_ITEMS.map((label, i) => (
            <div
              key={label}
              className={cx(
                'truncate rounded-sm px-2 py-1.5 text-[10px] font-medium',
                i === 0 ? 'bg-brand-soft text-brand' : 'text-ink-3'
              )}
            >
              {label}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold text-ink">Creator Command Center</p>
              <p className="text-[10px] text-ink-3">Omnichannel velocity up 24.6% this month</p>
            </div>
            <span className="hidden items-center gap-1 rounded-pill border border-brand-ring bg-brand-soft px-2 py-1 text-[9px] font-bold text-brand sm:flex">
              AI ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {KPIS.map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-line bg-surface p-2.5">
                <p className="text-[9px] text-ink-3">{kpi.label}</p>
                <p className="mt-0.5 text-[13px] font-bold text-ink">{kpi.value}</p>
                <p className="text-[9px] font-semibold text-success">{kpi.delta}</p>
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-3 lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-ink">Views &amp; Trajectory</p>
                <p className="text-[9px] text-ink-3">Last 30 days</p>
              </div>
              <svg viewBox="0 0 300 80" className="h-[70px] w-full" aria-hidden="true">
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cs-primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--cs-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,66 C40,60 60,54 90,46 C120,38 150,34 180,24 C210,15 250,10 300,6 L300,80 L0,80 Z"
                  fill="url(#heroGrad)"
                />
                <path
                  d="M0,66 C40,60 60,54 90,46 C120,38 150,34 180,24 C210,15 250,10 300,6"
                  fill="none"
                  stroke="var(--cs-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="rounded-lg border border-line bg-surface p-3">
              <p className="mb-2 text-[10px] font-semibold text-ink">Top Content</p>
              <div className="space-y-2">
                {TOP_ROWS.map((row) => (
                  <div key={row.title} className="flex items-center gap-2">
                    <span className={cx('h-6 w-1.5 shrink-0 rounded-pill', row.tone)} />
                    <div className="min-w-0">
                      <p className="truncate text-[9.5px] font-semibold text-ink">{row.title}</p>
                      <p className="text-[8.5px] text-ink-3">
                        {row.platform} • {row.metric}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-ring bg-brand-soft px-3 py-2">
            <span className="text-[10px] font-bold text-brand">AI</span>
            <p className="truncate text-[9.5px] text-ink-2">
              Publish “The Solopreneur AI Stack” Thursday 3:00 PM EST for +35% reach
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
