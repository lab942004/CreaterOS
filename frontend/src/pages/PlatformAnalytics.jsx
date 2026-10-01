import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, Eye, MonitorSmartphone, Users } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DeltaPill } from '../components/ui/MetricCard';
import { MetricGrid } from '../components/ui/Progress';
import { KeyValueList } from '../components/ui/Table';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PageLoader } from '../components/ui/Feedback';
import { PlatformMark, PlatformBadge } from '../components/ui/Platform';

const number = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

export default function PlatformAnalytics() {
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlatforms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPlatformAnalytics();
      setPlatforms(res.platforms || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  if (loading) return <PageLoader label="Loading platform intelligence…" />;
  if (error) {
    return (
      <ErrorState
        title="Platform breakdown unavailable"
        description={error.message || 'We could not load per-platform analytics.'}
        onRetry={loadPlatforms}
      />
    );
  }

  const totalReach = platforms.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Platform breakdown"
        subtitle="Compare posting cadence, follower growth and reach channel by channel."
        icon={MonitorSmartphone}
        action={
          <div className="flex items-center gap-2">
            <Badge tone="neutral" icon={Users}>
              {`${platforms.length} channels`}
            </Badge>
            <Badge tone="brand" icon={Eye}>
              {`${number(Math.round(totalReach))} est. monthly views`}
            </Badge>
          </div>
        }
      />

      {platforms.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {platforms.map((p) => (
            <Card key={p.id} hover className="flex flex-col overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <PlatformMark platform={p.platform} size={38} />
                  <div className="min-w-0">
                    <PlatformBadge platform={p.platform} size="sm" />
                    <h3 className="mt-1.5 truncate text-label font-semibold text-ink">{p.accountName}</h3>
                    <p className="truncate text-caption text-ink-3">{p.username}</p>
                  </div>
                </div>
                <DeltaPill value={p.growth} direction="up" tone="success" />
              </div>

              <div className="flex-1 space-y-4 px-5 py-4">
                <MetricGrid
                  columns={2}
                  items={[
                    { label: 'Followers', value: number(p.followers) },
                    { label: 'Engagement', value: typeof p.engagementRate === 'number' ? `${p.engagementRate}%` : '—' },
                  ]}
                />

                <KeyValueList
                  items={[
                    { label: 'Est. monthly views', value: number(p.views) },
                    { label: 'Publish cadence', value: p.postingFrequency || '—' },
                  ]}
                />

                {p.bestContent ? (
                  <div className="cs-inset flex items-center gap-3 px-3 py-2.5">
                    <CalendarClock className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                    <div className="min-w-0">
                      <span className="block text-caption text-ink-3">Best performer</span>
                      <span className="block truncate text-caption font-semibold text-ink">{p.bestContent.title}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-line px-5 py-3">
                <Button to="/analytics" variant="ghost" size="sm" iconRight={ArrowRight}>
                  Deep dive
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={MonitorSmartphone}
            title="No channels connected"
            description="Connect a platform to unlock per-channel reach, cadence and engagement comparisons."
            action={
              <Button to="/settings" variant="primary" size="sm">
                Connect a channel
              </Button>
            }
          />
        </Card>
      )}
    </div>
  );
}
