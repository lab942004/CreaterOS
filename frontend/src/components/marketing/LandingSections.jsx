import React from 'react';
import {
  Bot, CalendarClock, Layers, LineChart, Plug, Sparkles,
} from 'lucide-react';
import { PLATFORM_META, PlatformMark } from '../ui/Platform';
import { SectionHeading } from './MarketingShared';

/** TrustedBy — integration strip plus headline proof points. */
export function TrustedBy() {
  const stats = [
    { value: '6', label: 'Platforms connected' },
    { value: '12h+', label: 'Saved every week' },
    { value: '40+', label: 'Unified screens' },
    { value: '1', label: 'Login for everything' },
  ];

  return (
    <section className="relative border-y border-line py-14">
      <div className="mx-auto max-w-6xl px-6">
        <p className="cs-eyebrow text-center">Connect every channel you publish to</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {Object.entries(PLATFORM_META).map(([key, meta]) => (
            <span
              key={key}
              className="flex items-center gap-2.5 rounded-pill border border-line bg-surface px-3.5 py-2 shadow-e1"
            >
              <PlatformMark platform={key} size={20} />
              <span className="text-label font-semibold text-ink-2">{meta.label}</span>
            </span>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-line pt-10 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-[30px] font-extrabold tracking-tight text-ink">{stat.value}</p>
              <p className="mt-1 text-caption text-ink-3">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Plug,
    title: 'Connect your platforms',
    description: 'Link YouTube, TikTok, Instagram, LinkedIn and X through secure OAuth adapters in under a minute.',
  },
  {
    icon: LineChart,
    title: 'AI analyzes your content',
    description: 'Every asset is transcribed, scored against retention patterns and tagged with its Content DNA.',
  },
  {
    icon: Sparkles,
    title: 'Get your strategy',
    description: 'The AI Strategist converts your performance history into a concrete 30-day publishing roadmap.',
  },
  {
    icon: Layers,
    title: 'Create with AI',
    description: 'Generate hooks, full scripts, captions, thumbnails and short-form clips from a single brief.',
  },
  {
    icon: CalendarClock,
    title: 'Schedule and autopilot',
    description: 'Publish in algorithm-optimal windows, then let Autopilot repurpose winners across every network.',
  },
  {
    icon: Bot,
    title: 'Track, learn, repeat',
    description: 'Retention, revenue and audience signals feed straight back into your Creator Brain.',
  },
];

/** HowItWorks — the six-step operating loop that frames the whole product. */
export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="One loop from raw idea to compounding growth"
          description="CreatorOS replaces a dozen disconnected tools with a single feedback loop that gets sharper every time you publish."
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="cs-card cs-card-hover relative overflow-hidden p-6">
              <span className="absolute right-5 top-4 text-[44px] font-black leading-none text-ink-3 opacity-10">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <step.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lead font-semibold text-ink">{step.title}</h3>
              <p className="mt-1.5 text-label leading-relaxed text-ink-2">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
