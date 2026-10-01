import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, PenTool, Send, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Select, TextArea } from '../components/ui/Form';
import { cx } from '../components/ui/cn';
import { PlatformMark, platformLabel } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN', 'TWITTER', 'FACEBOOK'];
const TYPES = ['POST', 'VIDEO', 'SHORT', 'CAROUSEL', 'ARTICLE'];

export default function Composer() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [platform, setPlatform] = useState('YOUTUBE');
  const [type, setType] = useState('POST');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const canSubmit = title.trim().length > 0 && caption.trim().length > 0;

  const handleAIAssist = async () => {
    if (!title.trim()) {
      toast({
        tone: 'warning',
        title: 'Add a title first',
        description: 'The AI needs a topic to calibrate the caption.',
      });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await api.generateAIContent({ topic: title, platform, tone: 'Engaging', type });
      setCaption(res.generatedText || '');
      toast({ tone: 'ai', title: 'Caption drafted', description: 'Review, edit, then publish or schedule.' });
    } catch (err) {
      toast({ tone: 'error', title: 'AI assist failed', description: err.message });
    } finally {
      setAiGenerating(false);
    }
  };

  const handlePublishOrSchedule = async (isDraft = false) => {
    setLoading(true);
    try {
      await api.composePost({ title, caption, platform, type, scheduleTime: isDraft ? null : scheduleTime });
      toast({
        tone: 'success',
        title: isDraft ? 'Draft saved' : scheduleTime ? 'Post scheduled' : 'Publishing now',
        description: `${title} → ${platformLabel(platform)}`,
      });
      navigate('/content');
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save the post', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Composer"
        subtitle="Draft once, adapt per network, then publish live or schedule for the optimal window."
        icon={PenTool}
        action={
          <>
            <Button variant="secondary" size="md" loading={loading} onClick={() => handlePublishOrSchedule(true)}>
              Save draft
            </Button>
            <Button
              variant="ai"
              size="md"
              icon={Send}
              loading={loading}
              disabled={!canSubmit}
              onClick={() => handlePublishOrSchedule(false)}
            >
              {scheduleTime ? 'Schedule post' : 'Publish now'}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="space-y-5 p-5 xl:col-span-2">
          <div>
            <span className="cs-label">Destination</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const active = platform === p;
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPlatform(p)}
                    className={cx(
                      'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-label font-semibold transition-all',
                      active
                        ? 'border-brand-ring bg-brand-soft text-ink'
                        : 'border-line bg-surface-2 text-ink-2 hover:border-brand-ring hover:text-ink'
                    )}
                  >
                    <PlatformMark platform={p} size={20} />
                    {platformLabel(p)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_180px]">
            <Field label="Title" htmlFor="composer-title" required>
              <Input
                id="composer-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The hook your audience sees first"
              />
            </Field>

            <Field label="Format" htmlFor="composer-type">
              <Select id="composer-type" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Caption & body"
            htmlFor="composer-caption"
            hint={`${caption.length} characters — hashtags and CTA are appended by AI assist`}
            action={
              <Button variant="ghost" size="sm" icon={Sparkles} loading={aiGenerating} onClick={handleAIAssist}>
                AI enhance
              </Button>
            }
          >
            <TextArea
              id="composer-caption"
              rows={9}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write the caption, hashtags and call to action…"
            />
          </Field>

          <Field label="Schedule window" htmlFor="composer-schedule" hint="Leave empty to publish immediately.">
            <Input
              id="composer-schedule"
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </Field>
        </Card>

        <SectionCard
          title="Live preview"
          subtitle={platformLabel(platform)}
          icon={CalendarClock}
          action={scheduleTime ? <Badge tone="info">Scheduled</Badge> : <Badge tone="neutral">Instant</Badge>}
        >
          <div className="cs-inset p-4">
            <div className="flex items-center gap-2.5">
              <PlatformMark platform={platform} size={30} />
              <div className="min-w-0">
                <p className="truncate text-label font-semibold text-ink">{title || 'Post title'}</p>
                <p className="text-caption text-ink-3">
                  {scheduleTime ? new Date(scheduleTime).toLocaleString() : 'Publishing immediately'}
                </p>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-caption leading-relaxed text-ink-2">
              {caption || 'Your caption preview appears here as you type.'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge tone="brand" size="sm">
              {type}
            </Badge>
            <Badge tone="neutral" size="sm">
              {`${caption.length} chars`}
            </Badge>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
