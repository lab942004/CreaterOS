import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Flame, Lightbulb, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformBadge } from '../components/ui/Platform';

export default function Trends() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTrends();
      setTrends(res.trends || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  const hottest = trends.reduce((best, tr) => ((tr.velocity || 0) > (best?.velocity || 0) ? tr : best), null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} rows={3} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Trend feed unavailable"
        description={error.message || 'We could not load the trend radar.'}
        onRetry={loadTrends}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Discovery"
        title="Trend discovery"
        subtitle="Early algorithmic keyword surges and rising creative formats."
        icon={TrendingUp}
        action={
          <>
            <Badge tone="neutral">{`${trends.length} tracked signals`}</Badge>
            {hottest ? <Badge tone="warning" icon={Flame}>{`Hot: ${hottest.topic}`}</Badge> : null}
          </>
        }
      />

      {trends.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trends.map((tr) => (
            <Card key={tr.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <PlatformBadge platform={tr.platform} size="sm" />
                <span className="inline-flex items-center gap-1 text-caption font-semibold text-warning">
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  {`${tr.velocity}x velocity`}
                </span>
              </div>

              <h3 className="mt-3.5 text-title font-bold leading-snug text-ink">{tr.topic}</h3>
              <p className="mt-1 text-caption text-ink-3">
                {`${tr.volume?.toLocaleString() ?? '—'} searches · ${tr.category || 'General'}`}
              </p>

              <div className="cs-ai-surface mt-4 flex-1 rounded-xl px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
                  <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                  Recommended action
                </p>
                <p className="mt-1 text-caption leading-relaxed text-ink-2">{tr.suggestedAction}</p>
              </div>

              <div className="mt-4 border-t border-line pt-3.5">
                <Button to="/ideas" variant="ghost" size="sm" iconRight={ArrowUpRight}>
                  Turn into an idea
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={TrendingUp}
            title="No trends detected"
            description="The radar re-scans every network each hour. Fresh surges will appear here automatically."
          />
        </Card>
      )}
    </div>
  );
}
