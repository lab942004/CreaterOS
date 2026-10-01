import React, { useCallback, useEffect, useState } from 'react';
import { Globe, Lightbulb, Monitor, Smartphone, Tablet, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { MetricCard } from '../components/ui/MetricCard';
import { ProgressBar, StatRow } from '../components/ui/Progress';
import { AIInsight, PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { PlatformMark } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const DEVICE_ICONS = { Mobile: Smartphone, Desktop: Monitor, 'Tablet / TV': Tablet };

export default function Audience() {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadAudience = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [audience, asked] = await Promise.all([api.getAudience(), api.getAudienceQuestions()]);
      setData(audience);
      setQuestions(asked.questions || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudience();
  }, [loadAudience]);

  const handleTurnIdea = async (question) => {
    setBusyId(question.id);
    try {
      await api.turnQuestionToIdea(question.id);
      setQuestions((prev) => prev.map((q) => (q.id === question.id ? { ...q, status: 'CONVERTED' } : q)));
      toast({ tone: 'success', title: 'Idea created', description: 'It is now on your Ideas board with a Q&A hook.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Could not create the idea', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Loading audience intelligence…" />;
  if (error) {
    return (
      <ErrorState
        title="Audience data unavailable"
        description={error.message || 'We could not load demographics for this workspace.'}
        onRetry={loadAudience}
      />
    );
  }

  const demographics = data?.demographics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Audience"
        subtitle="Demographic breakdowns, device usage and returning viewer cohorts."
        icon={Users}
        action={<Badge tone="success" dot>{`+${data?.growthRate ?? 0}% this month`}</Badge>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total reach" value={data?.totalAudience?.toLocaleString() ?? '—'} delta={data?.growthRate} icon={Users} />
        <MetricCard
          label="Returning viewers"
          value={typeof data?.returningViewers === 'number' ? `${data.returningViewers}%` : '—'}
          caption="loyal subscriber base"
          icon={Users}
          tone="cyan"
        />
        <MetricCard
          label="Engagement rate"
          value={typeof data?.engagementRate === 'number' ? `${data.engagementRate}%` : '—'}
          caption="vs. platform average"
          icon={Globe}
          tone="info"
        />
        <MetricCard
          label="Top geography"
          value={demographics.countries?.[0]?.country ?? '—'}
          caption={demographics.countries?.[0] ? `${demographics.countries[0].percentage}% of reach` : undefined}
          icon={Globe}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title="Top geographies" subtitle="Share of total reach" icon={Globe}>
          <div className="space-y-4">
            {(demographics.countries || []).map((c) => (
              <StatRow key={c.country} label={c.country} value={`${c.percentage}%`} percent={c.percentage} />
            ))}
            {demographics.countries?.length ? null : <p className="text-caption text-ink-3">No geography data yet.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Age distribution" subtitle="Core cohort composition" icon={Users}>
          <div className="space-y-4">
            {(demographics.age || []).map((a) => (
              <StatRow
                key={a.group}
                label={`${a.group} years`}
                value={`${a.percentage}%`}
                percent={a.percentage}
                tone="cyan"
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Device & gender mix" subtitle="How they watch" icon={Smartphone}>
          <div className="space-y-4">
            {(demographics.devices || []).map((d) => {
              const Icon = DEVICE_ICONS[d.type] || Monitor;
              return (
                <div key={d.type}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-caption">
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink-2">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {d.type}
                    </span>
                    <span className="font-semibold text-ink">{`${d.percentage}%`}</span>
                  </div>
                  <ProgressBar value={d.percentage} tone="info" />
                </div>
              );
            })}

            {(demographics.gender || []).length ? (
              <div className="border-t border-line pt-4">
                <p className="cs-eyebrow mb-3">Gender split</p>
                <div className="space-y-3">
                  {(demographics.gender || []).map((g) => (
                    <StatRow key={g.type} label={g.type} value={`${g.percentage}%`} percent={g.percentage} tone="warning" />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {data?.aiInsights?.length ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {data.aiInsights.map((insight, idx) => (
            <AIInsight key={idx} title="Audience insight">
              {insight}
            </AIInsight>
          ))}
        </div>
      ) : null}

      <SectionCard
        title="Audience questions"
        subtitle="Asked directly in comments and community posts"
        icon={Lightbulb}
        bodyClassName="p-3"
      >
        {questions.length ? (
          <ul className="space-y-1.5">
            {questions.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-line hover:bg-surface-2"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <PlatformMark platform={q.platform} size={30} />
                  <div className="min-w-0">
                    <p className="text-label font-semibold text-ink">{q.question}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-ink-3">
                      <StatusBadge status={q.status} size="sm" />
                      <span>{`Asked ${q.frequency ?? 1}×`}</span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="soft"
                  size="sm"
                  icon={Lightbulb}
                  loading={busyId === q.id}
                  disabled={q.status === 'CONVERTED'}
                  onClick={() => handleTurnIdea(q)}
                >
                  {q.status === 'CONVERTED' ? 'Idea created' : 'Turn into idea'}
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-8 text-center text-caption text-ink-3">
            No repeated questions detected yet — CreatorOS scans comments automatically.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
