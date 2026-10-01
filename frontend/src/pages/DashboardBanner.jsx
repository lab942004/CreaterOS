import React from 'react';
import { Lightbulb, PenTool, Sparkles, Video } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

/**
 * DashboardBanner — the hero strip at the top of the Dashboard.
 * Carries the single strongest signal (growth) plus the three entry points
 * creators use most often.
 */
export function DashboardBanner({ growthRate }) {
  const growth = typeof growthRate === 'number' ? growthRate : null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-line bg-app-2 p-6 sm:p-8">
      <div className="pointer-events-none absolute inset-0 cs-aurora" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 cs-grid-overlay" aria-hidden="true" />

      <div className="relative max-w-2xl">
        <Badge tone="brand" icon={Sparkles}>
          AI operating system active
        </Badge>

        <h2 className="mt-3 text-display font-extrabold tracking-tight text-ink">Creator command centre</h2>

        <p className="mt-1.5 text-label leading-relaxed text-ink-2">
          {growth !== null ? (
            <>
              Omnichannel content velocity is up{' '}
              <strong className="font-bold text-success">+{growth}%</strong> this month. Your repurposing queue is the
              fastest path to compounding reach.
            </>
          ) : (
            <>Everything you publish, analyse and monetise lives in one place. Start by connecting a channel.</>
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <Button to="/composer" variant="ai" size="md" icon={PenTool}>
            Create content
          </Button>
          <Button to="/video-lab" variant="secondary" size="md" icon={Video}>
            Upload video
          </Button>
          <Button to="/ideas" variant="ghost" size="md" icon={Lightbulb}>
            Generate idea
          </Button>
        </div>
      </div>
    </section>
  );
}

export default DashboardBanner;
