import React from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { cx } from '../ui/cn';
import { Button } from '../ui/Button';
import { SectionHeading } from './MarketingShared';

const PLANS = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'forever',
    description: 'For creators publishing on a single channel.',
    features: ['1 connected platform', '30 AI generations / month', 'Analytics overview', 'Content library & calendar'],
    cta: 'Start free',
    variant: 'outline',
  },
  {
    name: 'Creator',
    price: '$49',
    cadence: 'per month',
    description: 'The full operating system for serious solo creators.',
    features: [
      '6 connected platforms',
      '500k AI tokens / month',
      'AI Strategist + Creator Brain',
      'Video Lab clipping & repurposing',
      'Smart Scheduler + Autopilot',
      'Brand deal CRM',
    ],
    cta: 'Start 14-day trial',
    variant: 'ai',
    featured: true,
  },
  {
    name: 'Studio',
    price: '$149',
    cadence: 'per month',
    description: 'For media teams running multiple channels and editors.',
    features: [
      'Everything in Creator',
      '5 team seats with roles',
      'Executive reports & exports',
      'Campaign management',
      'Priority support',
    ],
    cta: 'Talk to sales',
    variant: 'secondary',
  },
];

/** Pricing — three tiers with the Creator plan as the anchor. */
export function Pricing() {
  return (
    <section id="pricing" className="border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Cheaper than the stack it replaces"
          description="Every plan includes the unified workspace, dark and light themes, and unlimited content storage."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cx(
                'relative flex flex-col rounded-2xl border p-6',
                plan.featured ? 'border-brand-ring bg-surface shadow-glow lg:-mt-4 lg:mb-4' : 'border-line bg-surface shadow-e1'
              )}
            >
              {plan.featured ? (
                <span className="absolute -top-3 left-6 cs-badge cs-badge-solid">
                  <Sparkles className="h-3 w-3" aria-hidden="true" /> Most popular
                </span>
              ) : null}

              <h3 className="text-lead font-semibold text-ink">{plan.name}</h3>
              <p className="mt-1 text-caption text-ink-3">{plan.description}</p>

              <div className="mt-5 flex items-end gap-1.5">
                <span className="text-[36px] font-extrabold tracking-tight text-ink">{plan.price}</span>
                <span className="pb-1.5 text-caption text-ink-3">{plan.cadence}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-label text-ink-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
                      <Check className="h-2.5 w-2.5" aria-hidden="true" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button to="/register" variant={plan.variant} size="lg" full className="mt-7">
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: 'Do I have to reconnect my accounts every month?',
    a: 'No. Platform adapters hold encrypted OAuth tokens and refresh them automatically. You reconnect only if you revoke access at the source.',
  },
  {
    q: 'How does the AI know anything about my channel?',
    a: 'CreatorOS indexes your published content, analytics and Creator Brain memory. Every answer cites the specific posts and metrics it used.',
  },
  {
    q: 'Can I keep working if an integration is offline?',
    a: 'Yes. The workspace keeps a local content store, so drafting, scheduling and AI generation continue without interruption.',
  },
  {
    q: 'Is there a light theme?',
    a: 'Dark is the default, and a fully designed light theme ships with every plan. Your choice is remembered per device.',
  },
  {
    q: 'Can my editors collaborate?',
    a: 'Studio plans include up to five seats with role-based access, shared editorial tasks and a full audit trail.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'YouTube, Instagram, TikTok, LinkedIn, X and Facebook — each with its own adapter so format rules are respected per network.',
  },
];

/** FAQ — native details/summary keeps it accessible without extra state. */
export function FAQ() {
  return (
    <section id="faq" className="border-t border-line py-20">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading eyebrow="FAQ" title="Questions creators ask us first" />

        <div className="mt-12 space-y-3">
          {FAQS.map((item) => (
            <details key={item.q} className="cs-card group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="text-label font-semibold text-ink">{item.q}</span>
                <ChevronDown
                  className="h-4 w-4 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="border-t border-line px-5 py-4 text-label leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
