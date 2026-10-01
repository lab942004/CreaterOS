import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { AuroraBackdrop, GridBackdrop } from './MarketingShared';

/** FinalCTA — closing conversion band. */
export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-line py-20">
      <AuroraBackdrop />
      <GridBackdrop />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <span className="cs-badge cs-badge-brand mb-5">
          <Sparkles className="h-3 w-3" aria-hidden="true" /> Your operating system is ready
        </span>
        <h2 className="text-[32px] font-extrabold leading-tight tracking-tight text-ink sm:text-[42px]">
          Run your content like a system, <span className="cs-gradient-text">not a scramble</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lead text-ink-2">
          Connect your channels, let the AI read your history, and publish the next month of content with a plan you can
          actually see.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button to="/register" variant="ai" size="lg" iconRight={ArrowRight} className="w-full sm:w-auto">
            Start free — no card required
          </Button>
          <Button to="/dashboard" variant="outline" size="lg" className="w-full sm:w-auto">
            Explore the live workspace
          </Button>
        </div>
        <p className="mt-4 text-caption text-ink-3">
          Both demo accounts are pre-filled on the sign-in screen — you can look around without signing up.
        </p>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Analytics', to: '/analytics' },
      { label: 'AI Workspace', to: '/ai' },
      { label: 'Video Lab', to: '/video-lab' },
      { label: 'Automation', to: '/autopilot' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Solo creators', to: '/register' },
      { label: 'Media studios', to: '/team' },
      { label: 'Brand partnerships', to: '/brand-deals' },
      { label: 'Monetization', to: '/revenue' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'How it works', to: '/#how-it-works' },
      { label: 'Pricing', to: '/#pricing' },
      { label: 'FAQ', to: '/#faq' },
      { label: 'Executive reports', to: '/reports' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Security', to: '/security' },
      { label: 'Notifications', to: '/notifications' },
      { label: 'Settings', to: '/settings' },
      { label: 'Sign in', to: '/login' },
    ],
  },
];

/** MarketingFooter — closing navigation and legal line. */
export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-app-2">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <Logo size={34} />
            <p className="mt-4 max-w-xs text-caption leading-relaxed text-ink-3">
              The AI operating system for content: analytics, creation, distribution and monetization in one workspace.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="cs-eyebrow">{column.title}</p>
              <ul className="mt-3.5 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.to} className="text-caption text-ink-2 transition-colors hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-caption text-ink-3">© 2026 CreatorOS Inc. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="/#faq" className="text-caption text-ink-3 transition-colors hover:text-ink">
              Privacy
            </a>
            <a href="/#faq" className="text-caption text-ink-3 transition-colors hover:text-ink">
              Terms
            </a>
            <a href="/#faq" className="text-caption text-ink-3 transition-colors hover:text-ink">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
