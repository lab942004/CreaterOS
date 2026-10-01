import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { BackLink, PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/Progress';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { KeyValueList } from '../components/ui/Table';
import { Tag } from '../components/ui/Platform';

/** Attribute tile used across the DNA breakdown grid. */
function DnaAttribute({ label, value }) {
  return (
    <div className="cs-inset px-4 py-3.5">
      <span className="cs-eyebrow">{label}</span>
      <p className="mt-1.5 text-label font-semibold leading-relaxed text-ink">{value || '—'}</p>
    </div>
  );
}

function BulletList({ items, tone = 'success' }) {
  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;
  const toneClass = tone === 'success' ? 'text-success' : 'text-warning';
  return (
    <ul className="space-y-2.5">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2.5">
          <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${toneClass}`} aria-hidden="true" />
          <span className="text-label leading-relaxed text-ink-2">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ContentDNA() {
  const { id } = useParams();
  const [dna, setDna] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDNA = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContentDNA(id);
      setDna(res.dna);
      setContent(res.content);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDNA();
  }, [loadDNA]);

  if (loading) return <PageLoader label="Sequencing content DNA…" />;

  if (error || !dna) {
    return (
      <ErrorState
        title="DNA report unavailable"
        description={error?.message || 'This asset has no DNA report yet.'}
        onRetry={loadDNA}
      />
    );
  }

  const score = dna.score || 0;

  return (
    <div className="space-y-6">
      <BackLink to={`/content/${id}`}>Back to content</BackLink>

      <PageHeader
        eyebrow="Content DNA"
        title={content?.title || 'Content DNA breakdown'}
        subtitle="The reusable structure behind this asset — hook, pacing, tone and visual grammar."
        icon={Sparkles}
        action={
          <Badge tone={score >= 80 ? 'success' : 'brand'} size="md">
            {`AI DNA score ${score}/100`}
          </Badge>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <ProgressRing
            value={score}
            size={128}
            thickness={10}
            label={String(score)}
            sublabel="/ 100"
            tone={score >= 80 ? 'success' : 'brand'}
            className="mx-auto lg:mx-0"
          />

          <div className="min-w-0 flex-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <DnaAttribute label="Retention hook" value={dna.hook} />
              <DnaAttribute label="Tone & pacing" value={dna.tone} />
              <DnaAttribute label="Visual grammar" value={dna.visualStyle} />
            </div>

            <KeyValueList
              className="mt-4"
              items={[
                { label: 'Topic', value: dna.topic || '—' },
                { label: 'Format', value: dna.format || '—' },
                {
                  label: 'Length',
                  value: typeof dna.lengthSeconds === 'number' ? `${dna.lengthSeconds}s` : '—',
                },
                { label: 'Call to action', value: dna.cta || '—' },
              ]}
            />

            {dna.keywords?.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {dna.keywords.map((keyword, idx) => (
                  <Tag key={idx}>{keyword}</Tag>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          title="Strengths identified"
          subtitle="What is working and worth repeating"
          icon={CheckCircle2}
          className="xl:col-span-1"
        >
          {dna.strengths?.length ? (
            <BulletList items={dna.strengths} tone="success" />
          ) : (
            <p className="text-caption text-ink-3">No strengths detected yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="Areas for improvement"
          subtitle="Where the structure loses viewers"
          icon={AlertTriangle}
          className="xl:col-span-1"
        >
          {dna.weaknesses?.length ? (
            <BulletList items={dna.weaknesses} tone="warning" />
          ) : (
            <p className="text-caption text-ink-3">No weaknesses detected yet.</p>
          )}
        </SectionCard>

        <SectionCard
          title="AI recommendations"
          subtitle="Apply these to the next asset"
          icon={Sparkles}
          className="xl:col-span-1"
          bodyClassName="p-4"
        >
          {dna.recommendations?.length ? (
            <ol className="space-y-2.5">
              {dna.recommendations.map((rec, idx) => (
                <li key={idx} className="cs-ai-surface flex items-start gap-3 rounded-lg px-3.5 py-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill cs-gradient-brand text-caption font-bold text-white">
                    {idx + 1}
                  </span>
                  <span className="text-caption leading-relaxed text-ink-2">{rec}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-caption text-ink-3">No recommendations generated yet.</p>
          )}
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <Button to={`/content/${id}`} variant="secondary" size="md" iconRight={ArrowRight}>
          Back to asset
        </Button>
      </div>
    </div>
  );
}
