import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { cx } from '../ui/cn';
import { Alert, AIInsight } from '../ui/Feedback';
import { ProgressBar } from '../ui/Progress';
import { StepHeading } from './OnboardingPrimitives';

const ANALYSIS_TASKS = [
  'Connecting platform adapters',
  'Downloading published content metadata',
  'Transcribing long-form footage',
  'Scoring hooks and retention curves',
  'Indexing Creator Brain memory',
  'Drafting your first strategy brief',
];

/** Step 9 — Analysing content (animated progress). */
export function StepAnalyzing({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(timer);
          return 100;
        }
        return Math.min(100, prev + 7);
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) onComplete?.();
  }, [progress, onComplete]);

  const doneCount = Math.floor((progress / 100) * ANALYSIS_TASKS.length);

  return (
    <div className="space-y-6">
      <StepHeading
        title="Analysing your content"
        description="This is where CreatorOS earns its keep — the AI is reading your history to find what to repeat."
      />

      <ProgressBar value={progress} label="Analysis progress" hint={`${progress}%`} />

      <ul className="space-y-2.5">
        {ANALYSIS_TASKS.map((task, i) => {
          const done = i < doneCount;
          const active = i === doneCount;
          return (
            <li key={task} className="flex items-center gap-3 text-label">
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-pill',
                  done ? 'bg-success/15 text-success' : active ? 'bg-brand-soft text-brand' : 'bg-surface-3 text-ink-3'
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-pill bg-current" aria-hidden="true" />
                )}
              </span>
              <span className={done || active ? 'font-medium text-ink' : 'text-ink-3'}>{task}</span>
            </li>
          );
        })}
      </ul>

      <p className="text-caption text-ink-3">
        You can continue immediately — analysis keeps running in the background and updates as results land.
      </p>
    </div>
  );
}

/** Step 10 — First AI insight. */
export function StepInsight({ name, tones, platforms }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Your first AI insight is ready"
        description="Here is the first recommendation generated from your profile and connected channels."
      />

      <AIInsight title="Establish one anchor format before expanding" confidence={92}>
        Your best-performing historical content clusters around hands-on demonstrations. Publish a weekly{' '}
        <strong className="text-ink">12-minute build-along</strong> on {platforms[0] ? platforms[0] : 'YouTube'} for four
        weeks, then repurpose each episode into three vertical clips. This concentrates signal on one format so the
        algorithm can place you precisely.
      </AIInsight>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Weekly cadence', value: '2 long / 5 short' },
          { label: 'Primary window', value: 'Thu 3:00 PM EST' },
          { label: 'Voice', value: tones?.length ? tones.slice(0, 2).join(', ') : 'Authoritative' },
        ].map((item) => (
          <div key={item.label} className="cs-inset px-3.5 py-3">
            <p className="text-caption text-ink-3">{item.label}</p>
            <p className="mt-0.5 text-label font-bold text-ink">{item.value}</p>
          </div>
        ))}
      </div>

      <Alert tone="ai" title="Workspace ready">
        <span className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {name ? `${name}, your` : 'Your'} command centre is calibrated. Everything here stays editable from Creator Brain.
        </span>
      </Alert>
    </div>
  );
}
