import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { BackLink, PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/Modal';
import { MetricGrid, ProgressRing } from '../components/ui/Progress';
import { AIInsight, PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { KeyValueList } from '../components/ui/Table';
import { Tag, PlatformBadge } from '../components/ui/Platform';

const number = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

export default function ContentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [dna, setDna] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContentDetail(id);
      setContent(res.content);
      setDna(res.dna);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteContent(id);
      navigate('/content');
    } catch (err) {
      setError(err);
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <PageLoader label="Loading asset blueprint…" />;

  if (error && !content) {
    return (
      <ErrorState
        title="Asset unavailable"
        description={error.message || 'We could not load this content item.'}
        onRetry={loadDetail}
      />
    );
  }

  if (!content) {
    return (
      <ErrorState
        title="Content not found"
        description="This asset may have been deleted or moved to another workspace."
      />
    );
  }

  const createdLabel = content.publishedAt
    ? `Published ${new Date(content.publishedAt).toLocaleDateString()}`
    : content.createdAt
      ? `Created ${new Date(content.createdAt).toLocaleDateString()}`
      : '';

  return (
    <div className="space-y-6">
      <BackLink to="/content">Back to library</BackLink>

      <PageHeader
        eyebrow="Content asset"
        title={content.title}
        subtitle={content.description || content.caption || 'No description captured for this asset.'}
        action={
          <>
            <Button to={`/content/${id}/dna`} variant="ai" size="md" icon={Sparkles}>
              View full DNA
            </Button>
            <IconButton label="Delete asset" variant="ghost" icon={Trash2} onClick={() => setConfirmOpen(true)} />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex aspect-video items-center justify-center bg-surface-2">
              {content.thumbnailUrl ? (
                <img src={content.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-8 w-8 text-ink-3" aria-hidden="true" />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
              <PlatformBadge platform={content.platform} />
              {content.type ? <Badge tone="neutral">{content.type}</Badge> : null}
              <StatusBadge status={content.status} />
              {createdLabel ? <span className="ml-auto text-caption text-ink-3">{createdLabel}</span> : null}
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="cs-inset whitespace-pre-wrap px-4 py-3.5 text-body leading-relaxed text-ink-2">
                {content.caption || content.description || 'No caption drafted yet.'}
              </div>

              {content.tags?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {content.tags.map((tag, idx) => (
                    <Tag key={idx}>#{tag}</Tag>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          {dna ? (
            <SectionCard
              title="Content DNA preview"
              subtitle="The structural signals behind this asset's performance"
              icon={Sparkles}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProgressRing
                  value={dna.score}
                  size={104}
                  label={String(dna.score ?? '—')}
                  sublabel="/ 100"
                  tone={(dna.score || 0) >= 80 ? 'success' : 'brand'}
                  className="mx-auto sm:mx-0"
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="cs-eyebrow">Retention hook</p>
                    <p className="mt-1 text-label font-semibold text-ink">{dna.hook}</p>
                  </div>
                  <KeyValueList
                    items={[
                      { label: 'Tone', value: dna.tone || '—' },
                      { label: 'Visual grammar', value: dna.visualStyle || '—' },
                      { label: 'Target audience', value: dna.targetAudience || '—' },
                    ]}
                  />
                </div>
              </div>
            </SectionCard>
          ) : (
            <AIInsight title="No DNA report yet">
              Run the DNA sequencer to extract hooks, pacing and visual grammar from this asset.
            </AIInsight>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Engagement" subtitle="Lifetime performance" icon={Sparkles}>
            <MetricGrid
              columns={2}
              items={[
                { label: 'Views', value: number(content.views) },
                { label: 'Likes', value: number(content.likes) },
                { label: 'Comments', value: number(content.commentsCount) },
                { label: 'Shares', value: number(content.shares) },
              ]}
              className="mb-4"
            />

            <KeyValueList
              items={[
                {
                  label: 'Engagement rate',
                  value: typeof content.engagementRate === 'number' ? `${content.engagementRate}%` : '—',
                },
                {
                  label: 'Watch time',
                  value: typeof content.watchTimeMinutes === 'number' ? `${number(content.watchTimeMinutes)} min` : '—',
                },
                { label: 'Format', value: content.type || '—' },
                { label: 'Platform', value: content.platform || '—' },
              ]}
            />
          </SectionCard>

          <SectionCard title="Asset timeline" subtitle="Lifecycle events" icon={FileText}>
            <Timeline
              items={[
                {
                  id: 'created',
                  title: 'Drafted',
                  time: content.createdAt ? new Date(content.createdAt).toLocaleDateString() : '',
                  description: 'Asset created in the workspace.',
                  tone: 'brand',
                },
                {
                  id: 'scheduled',
                  title: content.scheduledAt ? 'Scheduled' : 'Scheduling pending',
                  time: content.scheduledAt ? new Date(content.scheduledAt).toLocaleDateString() : '',
                  description: content.scheduledAt
                    ? 'Queued in the Smart Scheduler for the optimal posting window.'
                    : 'Add this asset to the publishing queue to lock a time slot.',
                  tone: content.scheduledAt ? 'warning' : undefined,
                },
                {
                  id: 'published',
                  title: content.status === 'PUBLISHED' ? 'Published' : `Status: ${content.status || 'DRAFT'}`,
                  time: content.publishedAt ? new Date(content.publishedAt).toLocaleDateString() : '',
                  description:
                    content.status === 'PUBLISHED'
                      ? 'Live on the connected account and syncing analytics.'
                      : 'Not public yet — performance data starts after publishing.',
                  tone: content.status === 'PUBLISHED' ? 'success' : undefined,
                },
              ]}
            />
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleting}
        tone="danger"
        title="Delete this asset?"
        description={`“${content.title}” and its DNA report will be removed from the library. This cannot be undone.`}
        confirmLabel="Delete asset"
      />
    </div>
  );
}
