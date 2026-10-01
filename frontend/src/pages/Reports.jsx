import React, { useCallback, useEffect, useState } from 'react';
import { Eye, FileText, Heart, Plus, Printer, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Field, Input, Select } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { MetricGrid } from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { DataTable } from '../components/ui/Table';
import { useToast } from '../components/ui/ToastProvider';

const REPORT_TYPES = ['analytics', 'growth', 'revenue', 'audience'];

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const formatNumber = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');

const TYPE_TONES = { analytics: 'info', growth: 'success', revenue: 'brand', audience: 'cyan' };

export default function Reports() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [draft, setDraft] = useState({ title: '', type: 'analytics' });
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReports();
      setReports(res.reports || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleGenerate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await api.generateReport({ title: draft.title.trim(), type: draft.type });
      setReports((prev) => [res.report, ...prev]);
      setDraft({ title: '', type: draft.type });
      setModalOpen(false);
      toast({
        title: 'Report generated',
        description: res.report?.title,
        tone: 'ai',
      });
    } catch (err) {
      toast({ title: 'Could not generate the report', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openReport = async (report) => {
    setActive(report);
    try {
      const res = await api.getReportDetail(report.id);
      if (res?.report) setActive(res.report);
    } catch (err) {
      toast({ title: 'Could not load report detail', description: err.message, tone: 'error' });
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Report',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{row.title}</p>
          <p className="mt-0.5 text-caption text-ink-3">Created {formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge tone={TYPE_TONES[row.type] || 'neutral'} size="sm">
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (row) => (
        <p className="max-w-md text-caption leading-relaxed text-ink-2">{row.summary || '—'}</p>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button variant="secondary" size="sm" onClick={() => openReport(row)}>
          Open
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Executive reports"
          subtitle="Audits you can hand to sponsors, managers and partners."
          icon={FileText}
        />
        <SkeletonCard rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Reports unavailable"
        description={error.message || 'We could not load the report library.'}
        onRetry={loadReports}
      />
    );
  }

  const latest = reports[0];
  const latestMetrics = latest?.metrics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Executive reports"
        subtitle="Generate auditable performance briefs for sponsors, managers and partners."
        icon={FileText}
        action={
          <>
            <Badge tone="neutral" size="sm">
              {reports.length} {reports.length === 1 ? 'report' : 'reports'}
            </Badge>
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              Generate report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Journey views"
          value={formatNumber(latestMetrics.totalViews)}
          caption={latest ? `From “${latest.title}”` : 'No report yet'}
          icon={Eye}
          tone="info"
        />
        <MetricCard
          label="Engagement rate"
          value={typeof latestMetrics.engagementRate === 'number' ? `${latestMetrics.engagementRate}%` : '—'}
          caption="Cross-network average"
          icon={Heart}
          tone="error"
        />
        <MetricCard
          label="Sponsor revenue"
          value={typeof latestMetrics.grossSponsorships === 'number' ? `$${latestMetrics.grossSponsorships.toLocaleString()}` : '—'}
          caption="Gross sponsorship value"
          icon={Wallet}
          tone="success"
        />
        <MetricCard
          label="Conversion rate"
          value={typeof latestMetrics.conversionRate === 'number' ? `${latestMetrics.conversionRate}%` : '—'}
          caption="Audience to subscriber"
          icon={TrendingUp}
          tone="cyan"
        />
      </div>

      <DataTable
        columns={columns}
        rows={reports}
        empty={
          <EmptyState
            icon={FileText}
            title="No reports generated"
            description="Generate a brief to snapshot growth, revenue and engagement for a stakeholder."
            action={
              <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                Generate report
              </Button>
            }
          />
        }
      />

      <Card className="cs-ai-surface p-5">
        <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Report intelligence
        </p>
        <p className="mt-1.5 text-caption leading-relaxed text-ink-2">
          Each report is assembled from live Content DNA, analytics and revenue data, so numbers always match
          the workspace dashboards when you share them externally.
        </p>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate report"
        subtitle="Snapshots live analytics, revenue and Content DNA."
        icon={Sparkles}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="report-form" size="sm" icon={Plus} loading={saving}>
              Generate
            </Button>
          </>
        }
      >
        <form id="report-form" onSubmit={handleGenerate} className="space-y-4">
          <Field
            label="Report title"
            htmlFor="report-title"
            hint="Leave blank to use the standard monthly brief."
          >
            <Input
              id="report-title"
              value={draft.title}
              placeholder="Monthly executive content audit"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </Field>

          <Field label="Report type" htmlFor="report-type">
            <Select
              id="report-type"
              value={draft.type}
              onChange={(event) => setDraft({ ...draft, type: event.target.value })}
            >
              {REPORT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title || 'Report'}
        subtitle={active ? `${active.type} report · created ${formatDate(active.createdAt)}` : undefined}
        icon={FileText}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setActive(null)}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={() => {
                toast({ title: 'Opening print dialog', description: 'Choose “Save as PDF” to export.', tone: 'info' });
                window.print();
              }}
            >
              Export PDF
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="cs-inset px-4 py-3.5 text-label leading-relaxed text-ink-2">
            {active?.summary || 'No summary recorded for this report.'}
          </p>

          <MetricGrid
            columns={2}
            items={[
              { label: 'Total views', value: formatNumber(active?.metrics?.totalViews) },
              {
                label: 'Engagement rate',
                value:
                  typeof active?.metrics?.engagementRate === 'number'
                    ? `${active.metrics.engagementRate}%`
                    : '—',
              },
              {
                label: 'Gross sponsorships',
                value:
                  typeof active?.metrics?.grossSponsorships === 'number'
                    ? `$${active.metrics.grossSponsorships.toLocaleString()}`
                    : '—',
              },
              {
                label: 'Conversion rate',
                value:
                  typeof active?.metrics?.conversionRate === 'number'
                    ? `${active.metrics.conversionRate}%`
                    : '—',
              },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

