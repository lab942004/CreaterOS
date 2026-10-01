import React from 'react';
import { Field, Input, TextArea } from '../ui/Form';
import { OptionGrid, StepHeading } from './OnboardingPrimitives';

/** Step 1 — Welcome. */
export function StepWelcome() {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Let's set up your workspace"
        description="Ten guided steps. Most creators finish in under three minutes, and every answer can be changed later in Settings."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: '2 min', hint: 'Average setup time' },
          { label: '6', hint: 'Platforms available' },
          { label: '0', hint: 'Files required' },
        ].map((stat) => (
          <div key={stat.label} className="cs-inset px-4 py-3.5 text-center">
            <p className="text-[22px] font-bold text-ink">{stat.label}</p>
            <p className="mt-0.5 text-caption text-ink-3">{stat.hint}</p>
          </div>
        ))}
      </div>
      <p className="text-caption leading-relaxed text-ink-3">
        We use your answers to calibrate the AI Strategist, generate your first content ideas and pre-configure the
        publishing calendar.
      </p>
    </div>
  );
}

/** Step 2 — Creator name. */
export function StepCreatorName({ name, handle, setName, setHandle }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="What should we call you?"
        description="This becomes your workspace identity and appears on generated reports and shared assets."
      />
      <Field label="Creator or brand name" htmlFor="creator-name">
        <Input
          id="creator-name"
          type="text"
          placeholder="Alex Rivera"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Primary channel handle" htmlFor="creator-handle" hint="Used for previews and exports.">
        <Input
          id="creator-handle"
          type="text"
          placeholder="@alexriveratech"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
      </Field>
    </div>
  );
}

/** Step 3 — Creator type. */
export function StepCreatorType({ value, onChange }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="How do you operate?"
        description="This shapes your default workspace layout, team controls and reporting."
      />
      <OptionGrid
        value={value}
        onChange={onChange}
        options={[
          { label: 'Solo creator', value: 'SOLO', description: 'You publish and manage everything yourself.' },
          { label: 'Creator team', value: 'TEAM', description: 'Two to five people splitting production.' },
          { label: 'Media studio', value: 'STUDIO', description: 'Multiple channels with editors and managers.' },
          { label: 'Agency or brand', value: 'AGENCY', description: 'You run content for clients or in-house.' },
        ]}
      />
    </div>
  );
}

/** Step 4 — Content types. */
export function StepContentType({ value, onChange }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="What do you publish?"
        description="Select every format you create. CreatorOS optimises each one for its native platform rules."
      />
      <OptionGrid
        multiple
        columns={2}
        value={value}
        onChange={onChange}
        options={[
          { label: 'Long-form video', value: 'VIDEO', description: 'YouTube, Vimeo, courses' },
          { label: 'Shorts & Reels', value: 'SHORT', description: 'TikTok, Reels, Shorts' },
          { label: 'Podcasts', value: 'PODCAST', description: 'Audio-first episodes' },
          { label: 'Written articles', value: 'ARTICLE', description: 'Newsletters, LinkedIn, blogs' },
          { label: 'Carousels', value: 'CAROUSEL', description: 'Instagram, LinkedIn swipe posts' },
          { label: 'Livestreams', value: 'LIVE', description: 'Streams and repurposed VODs' },
        ]}
      />
    </div>
  );
}

/** Step 5 — Target audience. */
export function StepAudience({ audience, setAudience, audienceSize, setAudienceSize }) {
  return (
    <div className="space-y-6">
      <StepHeading
        title="Who are you speaking to?"
        description="The AI Strategist uses this to calibrate hook style, vocabulary and publishing cadence."
      />
      <Field label="Describe your audience" htmlFor="audience">
        <TextArea
          id="audience"
          rows={3}
          placeholder="Software engineers and technical founders who want to ship AI features without a research team."
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        />
      </Field>
      <Field label="Current audience size" htmlFor="audience-size" hint="An approximation is fine.">
        <Input
          id="audience-size"
          type="text"
          placeholder="250,000 followers across channels"
          value={audienceSize}
          onChange={(e) => setAudienceSize(e.target.value)}
        />
      </Field>
    </div>
  );
}
