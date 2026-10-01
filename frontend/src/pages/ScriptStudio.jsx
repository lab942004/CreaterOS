import React, { useState } from 'react';
import { Check, Clapperboard, Clock, Copy, Film, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Form';
import { MetricGrid } from '../components/ui/Progress';
import { AIInsight } from '../components/ui/Feedback';
import { EmptyState } from '../components/ui/States';
import { useToast } from '../components/ui/ToastProvider';

const PLATFORMS = ['YOUTUBE', 'TIKTOK', 'INSTAGRAM', 'LINKEDIN'];
const TONES = ['Engaging, High-Retention', 'Authoritative', 'Conversational', 'Playful'];
const LENGTHS = [
  { value: '30 seconds', label: '30 seconds · Short / Reel' },
  { value: '60 seconds', label: '60 seconds · Short / Reel' },
  { value: '3 minutes', label: '3 minutes · YouTube' },
  { value: '10 minutes', label: '10 minutes · Masterclass' },
];

export default function ScriptStudio() {
  const { toast } = useToast();

  const [topic, setTopic] = useState('Build an AI Agent in 10 Minutes');
  const [platform, setPlatform] = useState('YOUTUBE');
  const [tone, setTone] = useState('Engaging, High-Retention');
  const [length, setLength] = useState('60 seconds');
  const [script, setScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateScript = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await api.generateScript({ topic, platform, tone, length });
      setScript(res.script);
      toast({ tone: 'ai', title: 'Script sequenced', description: 'Scene breakdown is ready to shoot.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Script generation failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!script) return;
    const fullText = (script.scenes || [])
      .map((s) => `[Scene ${s.sceneNumber}] (${s.durationSec}s)\nVisual: ${s.visual}\nVoiceover: ${s.voiceover}\n`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ tone: 'success', title: 'Script copied' });
    } catch {
      toast({ tone: 'warning', title: 'Clipboard unavailable', description: 'Copy the scenes manually.' });
    }
  };

  const totalSeconds = (script?.scenes || []).reduce((sum, s) => sum + (s.durationSec || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Script studio"
        subtitle="Autonomous scene breakdown, voiceover drafting and pacing timing."
        icon={Clapperboard}
        action={script ? <Badge tone="brand">{`${script.scenes?.length || 0} scenes`}</Badge> : null}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <form onSubmit={handleGenerateScript} className="space-y-5">
            <Field label="Video topic" htmlFor="script-topic" required>
              <Input
                id="script-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Build an AI Agent in 10 Minutes"
              />
            </Field>

            <Field label="Platform" htmlFor="script-platform">
              <Select id="script-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tone" htmlFor="script-tone">
              <Select id="script-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Target duration" htmlFor="script-length">
              <Select id="script-length" value={length} onChange={(e) => setLength(e.target.value)}>
                {LENGTHS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Button type="submit" variant="ai" size="lg" icon={Sparkles} full loading={loading} disabled={!topic.trim()}>
              {loading ? 'Sequencing scenes…' : 'Generate script'}
            </Button>
          </form>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          {script ? (
            <>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-title font-bold text-ink">{script.title}</h2>
                    <p className="mt-0.5 text-caption text-ink-3">{`Pacing target: ${script.targetDuration || length}`}</p>
                  </div>
                  <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopy}>
                    {copied ? 'Copied' : 'Copy script'}
                  </Button>
                </div>

                <div className="mt-4">
                  <MetricGrid
                    columns={3}
                    items={[
                      { label: 'Scenes', value: String(script.scenes?.length || 0) },
                      { label: 'Runtime', value: `${totalSeconds}s` },
                      { label: 'Platform', value: platform },
                    ]}
                  />
                </div>

                {script.hook ? (
                  <div className="mt-4">
                    <AIInsight title="Opening hook">{script.hook}</AIInsight>
                  </div>
                ) : null}
              </Card>

              <SectionCard title="Scene breakdown" subtitle="Shot-by-shot pacing" icon={Film} bodyClassName="p-4">
                <ol className="space-y-3">
                  {(script.scenes || []).map((scene) => (
                    <li key={scene.sceneNumber} className="cs-inset p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2 text-caption font-bold text-brand">
                          <span className="flex h-6 w-6 items-center justify-center rounded-pill bg-brand-soft">
                            {scene.sceneNumber}
                          </span>
                          Scene {scene.sceneNumber}
                        </span>
                        <span className="inline-flex items-center gap-1 text-caption text-ink-3">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {`${scene.durationSec}s`}
                        </span>
                      </div>

                      <p className="mt-3 text-caption italic leading-relaxed text-ink-3">
                        <span className="font-semibold not-italic text-ink-2">Visual: </span>
                        {scene.visual}
                      </p>
                      <p className="mt-2 text-label leading-relaxed text-ink">
                        <span className="font-semibold text-ink-2">Voiceover: </span>
                        “{scene.voiceover}”
                      </p>
                    </li>
                  ))}
                </ol>

                {script.callToAction ? (
                  <div className="mt-4">
                    <AIInsight title="Call to action">{script.callToAction}</AIInsight>
                  </div>
                ) : null}
              </SectionCard>
            </>
          ) : (
            <Card>
              <EmptyState
                icon={Film}
                title="No script generated yet"
                description="Set the topic, platform, tone and target duration, then generate a scene-by-scene breakdown with timings and voiceover copy."
              />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
