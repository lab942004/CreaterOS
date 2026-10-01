import React, { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DollarSign, Handshake, Layers, PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { ChartCard, SectionCard } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Progress';
import { DataTable } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';

const money = (value) => (typeof value === 'number' ? `$${value.toLocaleString()}` : '—');

export default function Revenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getRevenue();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);

  if (loading) return <PageLoader label="Assembling revenue figures…" />;
  if (error) {
    return (
      <ErrorState
        title="Revenue unavailable"
        description={error.message || 'We could not load the revenue dashboard.'}
        onRetry={loadRevenue}
      />
    );
  }

  const { breakdown, history } = data || {};
  const total = breakdown?.totalRevenue || 0;

  const streams = [
    { label: 'Brand deals', value: breakdown?.monthlySponsorship || 0, tone: 'brand' },
    { label: 'YouTube AdSense', value: breakdown?.youtubeAds || 0, tone: 'error' },
    { label: 'Affiliate commissions', value: breakdown?.affiliateCommissions || 0, tone: 'success' },
    { label: 'Courses & products', value: breakdown?.courseAndDigitalProducts || 0, tone: 'cyan' },
  ];

  const rows = (history || []).map((month, index) => {
    const previous = (history || [])[index - 1];
    const growth = previous?.revenue ? ((month.revenue - previous.revenue) / previous.revenue) * 100 : null;
    return { ...month, growth };
  });

  const columns = [
    {
      key: 'month',
      header: 'Month',
      render: (row) => <span className="text-label font-semibold text-ink">{row.month}</span>,
    },
    {
      key: 'revenue',
      header: 'Total revenue',
      align: 'right',
      render: (row) => <span className="tabular-nums font-semibold">{money(row.revenue)}</span>,
    },
    {
      key: 'sponsorships',
      header: 'Sponsorships',
      align: 'right',
      render: (row) => <span className="tabular-nums">{money(row.sponsorships)}</span>,
    },
    {
      key: 'ads',
      header: 'Ad revenue',
      align: 'right',
      render: (row) => <span className="tabular-nums">{money(row.ads)}</span>,
    },
    {
      key: 'growth',
      header: 'MoM',
      align: 'right',
      render: (row) =>
        row.growth === null ? (
          <span className="text-ink-3">—</span>
        ) : (
          <Badge tone={row.growth >= 0 ? 'success' : 'error'} size="sm">
            {`${row.growth >= 0 ? '+' : ''}${row.growth.toFixed(1)}%`}
          </Badge>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monetisation"
        title="Revenue dashboard"
        subtitle="Sponsorship deals, platform ad revenue, affiliate income and digital products in one ledger."
        icon={DollarSign}
        action={
          <>
            <Badge tone="success" size="sm">
              Gross {money(total)}
            </Badge>
            <Button variant="secondary" to="/brand-deals" icon={Handshake}>
              Brand deals CRM
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Monthly gross"
          value={money(total)}
          delta={breakdown?.monthlyGrowth}
          caption="vs last month"
          icon={DollarSign}
          trend={(history || []).map((month) => month.revenue)}
        />
        <MetricCard
          label="Brand deals"
          value={money(breakdown?.monthlySponsorship)}
          caption={`${total ? Math.round(((breakdown?.monthlySponsorship || 0) / total) * 100) : 0}% of revenue`}
          icon={Handshake}
          tone="brand"
        />
        <MetricCard
          label="Ad revenue"
          value={money(breakdown?.youtubeAds)}
          caption="YouTube AdSense"
          icon={PlayCircle}
          tone="error"
        />
        <MetricCard
          label="Affiliate & products"
          value={money((breakdown?.affiliateCommissions || 0) + (breakdown?.courseAndDigitalProducts || 0))}
          caption="Recurring and one-off"
          icon={Layers}
          tone="cyan"
        />
      </div>

      <ChartCard
        title="Revenue trajectory"
        subtitle="Total, sponsorship and ad revenue by month"
        icon={DollarSign}
        height={300}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={history || []} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cs-line-2)" />
            <XAxis dataKey="month" stroke="var(--cs-ink-3)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--cs-ink-3)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value) => money(Number(value))}
              contentStyle={{
                backgroundColor: 'var(--cs-surface-2)',
                border: '1px solid var(--cs-line-2)',
                borderRadius: '10px',
                color: 'var(--cs-ink)',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'var(--cs-ink-2)' }}
            />
            <Bar dataKey="revenue" name="Total" fill="var(--cs-primary)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="sponsorships" name="Sponsorships" fill="var(--cs-cyan)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard title="Revenue mix" subtitle="Share of gross by stream" icon={Layers}>
          <div className="space-y-4">
            {streams.map((stream) => (
              <ProgressBar
                key={stream.label}
                label={stream.label}
                value={total ? (stream.value / total) * 100 : 0}
                hint={money(stream.value)}
                tone={stream.tone}
              />
            ))}
          </div>
        </SectionCard>

        <DataTable className="xl:col-span-2" columns={columns} rows={rows} />
      </div>
    </div>
  );
}
