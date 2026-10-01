import React, { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Eye, Heart, MessageSquare, Timer, TrendingUp } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { ChartCard, SectionCard } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { SegmentedControl } from '../components/ui/Tabs';
import { DataTable } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Progress';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { PlatformBadge, platformLabel } from '../components/ui/Platform';

const TIMEFRAMES = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '1y', label: '1Y' },
];

const number = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

export default function AnalyticsOverview() {
  const [timeframe, setTimeframe] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalyticsOverview(timeframe);
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { totals, growthSeries, contentPerformance } = data || {};
  const peak = (growthSeries || []).reduce((max, point) => (point.views > (max?.views || 0) ? point : max), null);

  const columns = [
    {
      key: 'title',
      header: 'Content',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{row.title}</p>
          <p className="mt-0.5 text-caption text-ink-3">{row.contentType || row.type || 'Content asset'}</p>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (row) => <PlatformBadge platform={row.platform} size="sm" />,
    },
    {
      key: 'views',
      header: 'Views',
      align: 'right',
      render: (row) => <span className="tabular-nums">{number(row.views)}</span>,
    },
    {
      key: 'engagementRate',
      header: 'Engagement',
      align: 'right',
      render: (row) =>
        typeof row.engagementRate === 'number' ? (
          <Badge tone={row.engagementRate >= 10 ? 'success' : 'neutral'} size="sm">
            {row.engagementRate}%
          </Badge>
        ) : (
          <span className="text-ink-3">—</span>
        ),
    },
  ];

  if (loading) return <PageLoader label="Crunching cross-channel analytics…" />;
  if (error) {
    return (
      <ErrorState
        title="Analytics unavailable"
        description={error.message || 'We could not load the analytics overview.'}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics intelligence"
        subtitle="Cross-channel reach, retention and viewer engagement loops."
        icon={BarChart3}
        action={<SegmentedControl options={TIMEFRAMES} value={timeframe} onChange={setTimeframe} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total views" value={number(totals?.views)} delta={24.2} caption="acceleration" icon={Eye} />
        <MetricCard
          label="Watch time"
          value={number(totals?.watchTimeHours)}
          unit="hours"
          caption="58.4% avg retention"
          icon={Timer}
          tone="cyan"
        />
        <MetricCard label="Total likes" value={number(totals?.likes)} delta={14.3} caption="engagement rate" icon={Heart} tone="warning" />
        <MetricCard
          label="Total comments"
          value={number(totals?.comments)}
          delta="High intent"
          deltaDirection="up"
          caption="audience signal"
          icon={MessageSquare}
          tone="info"
        />
      </div>

      <ChartCard
        title="Views trajectory"
        subtitle={`${timeframe.toUpperCase()} window · peak ${number(peak?.views)} views`}
        icon={TrendingUp}
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={growthSeries || []}>
            <defs>
              <linearGradient id="analyticsViewsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--cs-primary)" stopOpacity={0.42} />
                <stop offset="95%" stopColor="var(--cs-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cs-line-2)" />
            <XAxis dataKey="date" stroke="var(--cs-ink-3)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--cs-ink-3)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--cs-surface-2)',
                border: '1px solid var(--cs-line-2)',
                borderRadius: '10px',
                color: 'var(--cs-ink)',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--cs-ink-2)' }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--cs-primary)"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#analyticsViewsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-label font-semibold text-ink">Content performance</h2>
            <p className="mt-0.5 text-caption text-ink-3">Every asset measured against the selected window.</p>
          </div>
          <Badge tone="brand" size="sm">{`${contentPerformance?.length || 0} assets`}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SectionCard title="Audience health" subtitle="Derived from this window" icon={Heart}>
            <div className="space-y-4">
              <ProgressBar label="Retention" value={58.4} hint="58.4%" tone="success" />
              <ProgressBar
                label="Engagement rate"
                value={Math.min(totals?.engagement ?? 0, 100)}
                hint={`${totals?.engagement ?? 0}%`}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="cs-inset px-3 py-2.5">
                  <span className="block text-caption text-ink-3">Followed audience</span>
                  <span className="mt-0.5 block text-lead font-bold text-ink">{number(totals?.followers)}</span>
                </div>
                <div className="cs-inset px-3 py-2.5">
                  <span className="block text-caption text-ink-3">Shares</span>
                  <span className="mt-0.5 block text-lead font-bold text-ink">{number(totals?.shares)}</span>
                </div>
              </div>
            </div>
          </SectionCard>

          <DataTable
            className="xl:col-span-2"
            columns={columns}
            rows={contentPerformance || []}
            empty={<ErrorState title="No performance data" description="Publish a piece of content to start measuring it." />}
          />
        </div>
      </section>
    </div>
  );
}
