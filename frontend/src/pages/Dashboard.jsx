import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Link2, PenTool, Sparkles, Video } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { DeltaPill } from '../components/ui/MetricCard';
import { AIInsight, Alert, PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformMark, platformLabel } from '../components/ui/Platform';
import { DashboardBanner } from './DashboardBanner';
import { DashboardCards } from './DashboardCards';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) return <PageLoader label="Loading your command centre…" />;

  if (error) {
    return (
      <ErrorState
        title="Dashboard unavailable"
        description={error.message || 'The workspace API did not respond. Check your connection and try again.'}
        onRetry={loadDashboard}
      />
    );
  }

  const { metrics, topPerforming, socialAccounts, aiRecommendations } = data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Command centre"
        title="Dashboard"
        subtitle="Your publishing velocity, audience growth and AI priorities at a glance."
        icon={LayoutDashboard}
        action={
          <>
            <Button to="/video-lab" variant="secondary" size="md" icon={Video}>
              Upload video
            </Button>
            <Button to="/composer" variant="ai" size="md" icon={PenTool}>
              New content
            </Button>
          </>
        }
      />

      <DashboardBanner growthRate={metrics?.growthRate} />
      <DashboardCards metrics={metrics} />

      {aiRecommendations?.length ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-label font-semibold text-ink">AI recommendations</h2>
            <Button to="/ai/strategist" variant="ghost" size="sm" iconRight={ArrowRight}>
              Open strategist
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {aiRecommendations.map((rec) => (
              <AIInsight key={rec.id} title={rec.title}>
                {rec.description}
              </AIInsight>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Top performing content"
          subtitle="Ranked by reach across every connected channel"
          icon={Sparkles}
          action={
            <Button to="/content" variant="ghost" size="sm" iconRight={ArrowRight}>
              View all
            </Button>
          }
          bodyClassName="p-3"
        >
          {topPerforming?.length ? (
            <ul className="space-y-1.5">
              {topPerforming.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={`/content/${item.id}`}
                    className="flex items-center gap-3.5 rounded-lg border border-transparent p-2.5 transition-colors hover:border-line hover:bg-surface-2"
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover"
                      />
                    ) : (
                      <PlatformMark platform={item.platform} size={48} />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label font-semibold text-ink">{item.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-caption text-ink-3">
                        <span className="font-semibold text-ink-2">{platformLabel(item.platform)}</span>
                        <span aria-hidden="true">•</span>
                        <span>{item.views?.toLocaleString()} views</span>
                      </div>
                    </div>

                    {typeof item.engagementRate === 'number' ? (
                      <span className="hidden shrink-0 sm:inline-flex">
                        <DeltaPill value={item.engagementRate} />
                      </span>
                    ) : null}
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Video}
              title="No published content yet"
              description="Connect a channel or publish your first asset and performance data lands here."
              action={
                <Button to="/composer" variant="primary" size="sm">
                  Create content
                </Button>
              }
            />
          )}
        </SectionCard>

        <SectionCard
          title="Connected accounts"
          subtitle={`${socialAccounts?.length || 0} channels syncing`}
          icon={Link2}
          bodyClassName="p-3"
        >
          {socialAccounts?.length ? (
            <>
              <ul className="space-y-1">
                {socialAccounts.map((soc) => (
                  <li key={soc.id} className="flex items-center justify-between gap-3 rounded-lg p-2.5 hover:bg-surface-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <PlatformMark platform={soc.platform} size={32} />
                      <span className="min-w-0">
                        <span className="block truncate text-label font-semibold text-ink">{soc.accountName}</span>
                        <span className="block truncate text-caption text-ink-3">{soc.username}</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-label font-bold tabular-nums text-ink">
                      {soc.followers?.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <Alert tone="success" title="All adapters healthy">
                  Tokens refresh automatically. Nothing needs your attention right now.
                </Alert>
              </div>
            </>
          ) : (
            <EmptyState
              icon={Link2}
              title="No channels connected"
              description="Link a platform so CreatorOS can pull analytics and publish for you."
              action={
                <Button to="/settings" variant="secondary" size="sm">
                  Connect a channel
                </Button>
              }
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
