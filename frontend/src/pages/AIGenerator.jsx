import React, { useState } from 'react';
import { Check, Copy, Hash, Megaphone, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Select, TextArea } from '../components/ui/Form';
import { EmptyState } from '../components/ui/States';
import { Tag, PlatformBadge } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN'];
const TONES = ['Authoritative', 'Conversational', 'Playful', 'Inspiring', 'Technical', 'Bold'];

export default function AIGenerator() {
  const { toast } = useToast();

  const [topic, setTopic] = useState('10x Developer with Autonomous Agents');
  const [platform, setPlatform] = useState('YOUTUBE');
  const [tone, setTone] = useState('Authoritative');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await api.generateAIContent({ topic, platform, tone });
      setResult(res);
      toast({ tone: 'ai', title: 'Copy generated', description: 'Review before publishing to the Composer.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Generation failed', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.generatedText) return;
    try {
      await navigator.clipboard.writeText(result.generatedText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ tone: 'success', title: 'Copied to clipboard' });
    } catch {
      toast({ tone: 'warning', title: 'Clipboard unavailable', description: 'Copy the text manually instead.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI studio"
        title="AI content generator"
        subtitle="Captions, hooks and hashtags calibrated to each platform's distribution rules."
        icon={Wand2}
        action={<Badge tone="brand" icon={Sparkles}>GPT-class drafts</Badge>}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <form onSubmit={handleGenerate} className="space-y-5">
            <Field label="Content concept" htmlFor="gen-topic" hint="Be specific — it becomes the prompt.">
              <TextArea
                id="gen-topic"
                rows={4}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. How I automated my editing pipeline with agents"
              />
            </Field>

            <Field label="Target platform" htmlFor="gen-platform">
              <Select id="gen-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Tone of voice" htmlFor="gen-tone">
              <Select id="gen-tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>

            <Button type="submit" variant="ai" size="lg" icon={Sparkles} full loading={loading} disabled={!topic.trim()}>
              {loading ? 'Synthesising…' : 'Generate copy'}
            </Button>
          </form>
        </Card>

        <SectionCard
          className="xl:col-span-2"
          title="Generated output"
          subtitle={result ? `${tone} tone · ${platform}` : 'Nothing generated yet'}
          icon={Sparkles}
          action={
            result ? (
              <Button variant="secondary" size="sm" icon={copied ? Check : Copy} onClick={handleCopy}>
                {copied ? 'Copied' : 'Copy text'}
              </Button>
            ) : null
          }
        >
          {result ? (
            <div className="space-y-5">
              <div className="cs-inset whitespace-pre-wrap px-4 py-4 text-body leading-relaxed text-ink-2">
                {result.generatedText}
              </div>

              {result.hashtags?.length ? (
                <div>
                  <p className="cs-eyebrow flex items-center gap-1.5">
                    <Hash className="h-3 w-3" aria-hidden="true" />
                    Hashtags
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.hashtags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>
              ) : null}

              {result.cta ? (
                <div className="cs-ai-surface flex items-start gap-3 rounded-xl px-4 py-3.5">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-brand">Call to action</p>
                    <p className="mt-0.5 text-label leading-relaxed text-ink-2">{result.cta}</p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <PlatformBadge platform={platform} size="sm" />
                <Button to="/composer" variant="soft" size="sm">
                  Send to Composer
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Wand2}
              title="No output yet"
              description="Set the concept, platform and tone, then generate. Drafts appear here with hashtags and a CTA block."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
