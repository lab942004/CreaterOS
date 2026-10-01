import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Clock, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressRing } from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformMark, PlatformBadge, platformLabel } from '../components/ui/Platform';

export default function SmartScheduler() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadScheduler = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSmartScheduler();
      setRecommendations(res.recommendations || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScheduler();
  }, [loadScheduler]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Scheduler unavailable"
        description={error.message || 'We could not load predicted publishing windows.'}
        onRetry={loadScheduler}
      />
    );
  }

  const top = recommendations.reduce(
    (best, r) => ((r.confidenceScore || 0) > (best?.confidenceScore || 0) ? r : best),
    null
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Smart scheduler"
        subtitle="AI-predicted publishing windows calibrated to subscriber activity spikes."
        icon={CalendarClock}
        action={
          <>
            <Badge tone="neutral">{`${recommendations.length} channels analysed`}</Badge>
            <Button to="/composer" variant="ai" size="md" icon={Sparkles}>
              Schedule a post
            </Button>
          </>
        }
      />

      {top ? (
        <Card className="cs-ai-surface p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <PlatformMark platform={top.platform} size={44} />
              <div className="min-w-0">
                <p className="text-caption font-semibold text-brand">Highest confidence window</p>
                <h2 className="mt-0.5 text-title font-bold text-ink">{top.bestTime}</h2>
                <p className="mt-0.5 text-caption text-ink-3">{platformLabel(top.platform)}</p>
              </div>
            </div>
            <Badge tone="success" size="md">{`${top.confidenceScore}% confidence`}</Badge>
          </div>
        </Card>
      ) : null}

      {recommendations.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {recommendations.map((r) => (
            <Card key={r.platform} hover className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <PlatformBadge platform={r.platform} />
                <ProgressRing
                  value={r.confidenceScore}
                  size={64}
                  thickness={6}
                  tone={(r.confidenceScore || 0) >= 90 ? 'success' : 'brand'}
                  label={`${r.confidenceScore ?? 0}%`}
                />
              </div>

              <div className="mt-4">
                <p className="cs-eyebrow flex items-center gap-1.5">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Recommended window
                </p>
                <p className="mt-1 text-title font-bold text-ink">{r.bestTime}</p>
              </div>

              <p className="cs-inset mt-4 flex-1 px-4 py-3 text-caption leading-relaxed text-ink-2">{r.reason}</p>

              <div className="mt-4 border-t border-line pt-3.5">
                <Button to="/composer" variant="soft" size="sm">
                  Use this window
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title="No windows predicted yet"
            description="Connect at least one channel and CreatorOS will model the hours your audience actually shows up."
          />
        </Card>
      )}
    </div>
  );
}
