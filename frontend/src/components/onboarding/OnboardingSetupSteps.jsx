import React from 'react';
import { Check, Plug, Upload, Wand2 } from 'lucide-react';
import { cx } from '../ui/cn';
import { Field, TextArea, Toggle } from '../ui/Form';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Feedback';
import { PLATFORM_META, PlatformMark } from '../ui/Platform';
import { OptionGrid, StepHeading } from './OnboardingPrimitives';

const TONES = [
  { label: 'Authoritative', value: 'Authoritative' },
  { label: 'Actionable', value: 'Actionable' },
  { label: 'Friendly', value: 'Friendly' },
  { label: 'Energetic', value: 'Energetic' },
  { label: 'Analytical', value: 'Analytical' },
  { label: 'Provocative', value: 'Provocative' },
];

/** Step 6 — Brand voice. */
export function StepBrandVoice({ tones, setTones, voice, setVoice }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="How should the AI sound?"
        description="Every caption, script and hook inherits this voice unless you override it per asset."
      />
      <OptionGrid multiple columns={3} value={tones} onChange={setTones} options={TONES} />
      <Field label="Voice notes" htmlFor="voice" hint="Anything the AI should always do — or never do.">
        <TextArea
          id="voice"
          rows={3}
          placeholder="Lead with a concrete number. Never use hype words like 'game-changing'. Always end with a question."
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
        />
      </Field>
    </div>
  );
}

/** Step 7 — Connect platforms. */
export function StepPlatforms({ platforms, togglePlatform, onSelectAll }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Connect your channels"
        description="CreatorOS uses secure OAuth adapters. In this demo environment connections are simulated."
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-caption text-ink-3">
          {platforms.length} of {Object.keys(PLATFORM_META).length} channels selected
        </p>
        <Button variant="soft" size="sm" icon={Plug} onClick={onSelectAll}>
          Select all
        </Button>
      </div>

      <div className="space-y-2.5">
        {Object.entries(PLATFORM_META).map(([key, meta]) => {
          const connected = platforms.includes(key);
          return (
            <div
              key={key}
              className={cx(
                'flex items-center justify-between gap-4 rounded-xl border px-3.5 py-3 transition-colors',
                connected ? 'border-brand-ring bg-brand-soft' : 'border-line bg-surface-2'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <PlatformMark platform={key} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-label font-semibold text-ink">{meta.label}</p>
                  <p className="text-caption text-ink-3">{connected ? 'Ready to import' : 'Not connected'}</p>
                </div>
              </div>
              <Toggle checked={connected} onChange={() => togglePlatform(key)} label={`Connect ${meta.label}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Step 8 — Import content. */
export function StepImport({ selection, setSelection }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Import your existing content"
        description="Bringing history in lets the AI find patterns in what already works. Nothing is published from here."
      />

      <OptionGrid
        multiple
        columns={2}
        value={selection}
        onChange={setSelection}
        options={[
          { label: 'Sync channel history', value: 'HISTORY', icon: Plug, description: 'Last 24 months of posts and metrics' },
          { label: 'Import analytics', value: 'ANALYTICS', icon: Wand2, description: 'Retention, reach and engagement data' },
          { label: 'Upload raw footage', value: 'FOOTAGE', icon: Upload, description: 'Send masters to the Video Lab' },
          { label: 'Skip for now', value: 'SKIP', icon: Check, description: 'Start with a blank library' },
        ]}
      />

      <Alert tone="info" title="Runs in the background">
        Importing continues after onboarding. You can close the tab and the library fills in behind the scenes.
      </Alert>
    </div>
  );
}
