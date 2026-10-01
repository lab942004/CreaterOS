import React, { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus, Target } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformBadge } from '../components/ui/Platform';

/** Benchmarks mix large counts with single-decimal rates, so formatting adapts. */
const formatMetric = (value) =>
  typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—';

function verdictFor(benchmark) {
  const { user, top10Percent, industryAvg } = benchmark;
  if (typeof user !== 'number' || typeof top10Percent !== 'number') return { tone: 'neutral', label: 'No data', Icon: Minus };
  if (user >= top10Percent) return { tone: 'success', label: 'Top 10% tier', Icon: ArrowUpRight };
  if (typeof industryAvg === 'number' && user >= industryAvg) return { tone: 'info', label: 'Above average', Icon: ArrowUpRight };
  return { tone: 'warning', label: 'Below average', Icon: ArrowDownRight };
}

export default function Benchmark() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBenchmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBenchmarks();
      setBenchmarks(res.benchmarks || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBenchmarks();
  }, [loadBenchmarks]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} rows={3} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Benchmark data unavailable"
        description={error.message || 'We could not load cohort comparisons.'}
        onRetry={loadBenchmarks}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Intelligence"
        title="Benchmark studio"
        subtitle="Compare your channel metrics against anonymised top-10% creator cohorts."
        icon={Target}
        action={<Badge tone="brand">{`${benchmarks.length} comparisons`}</Badge>}
      />

      {benchmarks.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {benchmarks.map((b, idx) => {
            const verdict = verdictFor(b);
            const VerdictIcon = verdict.Icon;
            const relative =
              typeof b.user === 'number' && typeof b.top10Percent === 'number' && b.top10Percent > 0
                ? Math.min((b.user / b.top10Percent) * 100, 100)
                : 0;

            return (
              <Card key={b.category || idx} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-label font-semibold text-ink">{b.category}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <PlatformBadge platform={b.platform} size="sm" />
                    <Badge tone={verdict.tone} size="sm" icon={VerdictIcon}>
                      {verdict.label}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
                  <div className="cs-ai-surface rounded-lg px-2 py-3">
                    <span className="block text-caption font-semibold text-brand">Your metrics</span>
                    <span className="mt-1 block text-lead font-bold text-ink">{formatMetric(b.user)}</span>
                  </div>
                  <div className="cs-inset px-2 py-3">
                    <span className="block text-caption text-ink-3">Top 10%</span>
                    <span className="mt-1 block text-lead font-semibold text-ink-2">{formatMetric(b.top10Percent)}</span>
                  </div>
                  <div className="cs-inset px-2 py-3">
                    <span className="block text-caption text-ink-3">Industry avg</span>
                    <span className="mt-1 block text-lead font-semibold text-ink-2">{formatMetric(b.industryAvg)}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <ProgressBar
                    label="Against the top 10% cohort"
                    value={relative}
                    hint={`${Math.round(relative)}%`}
                    tone={verdict.tone === 'success' ? 'success' : verdict.tone === 'warning' ? 'warning' : 'brand'}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Target}
            title="No benchmark data"
            description="Cohort comparisons appear once analytics have been synced for at least one channel."
          />
        </Card>
      )}
    </div>
  );
}
