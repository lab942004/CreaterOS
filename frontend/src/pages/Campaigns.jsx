import React, { useCallback, useEffect, useState } from 'react';
import { Banknote, CalendarClock, Megaphone, Plus, Target } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Field, Input } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { DataTable } from '../components/ui/Table';
import { Tag, platformLabel } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const money = (value) => (typeof value === 'number' ? `$${value.toLocaleString()}` : '—');

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const emptyDraft = { title: '', brandName: '', budget: '', deadline: '' };

export default function Campaigns() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.campaigns || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.title.trim() || !draft.brandName.trim()) {
      toast({ title: 'Title and sponsor are required', tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.createCampaign({
        title: draft.title.trim(),
        brandName: draft.brandName.trim(),
        budget: parseFloat(draft.budget) || 10000,
        ...(draft.deadline ? { deadline: new Date(draft.deadline).toISOString() } : {}),
      });
      setCampaigns((prev) => [res.campaign, ...prev]);
      setDraft(emptyDraft);
      setModalOpen(false);
      toast({ title: 'Campaign created', description: res.campaign?.title, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not create the campaign', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Monetisation"
          title="Campaigns"
          subtitle="Multi-video partnership campaigns and their milestones."
          icon={Megaphone}
        />
        <SkeletonCard rows={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Campaigns unavailable"
        description={error.message || 'We could not load the campaign list.'}
        onRetry={loadCampaigns}
      />
    );
  }

  const active = campaigns.filter((campaign) => campaign.status === 'ACTIVE');
  const committed = campaigns.reduce((sum, campaign) => sum + (campaign.budget || 0), 0);
  const average = campaigns.length ? Math.round(committed / campaigns.length) : 0;
  const upcoming = campaigns
    .map((campaign) => campaign.deadline)
    .filter(Boolean)
    .sort((a, b) => new Date(a) - new Date(b))[0];

  const columns = [
    {
      key: 'title',
      header: 'Campaign',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{row.title}</p>
          <p className="mt-0.5 text-caption text-ink-3">{row.brandName || 'Unassigned sponsor'}</p>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      align: 'right',
      render: (row) => <span className="tabular-nums font-semibold">{money(row.budget)}</span>,
    },
    {
      key: 'deliverables',
      header: 'Deliverables',
      render: (row) => {
        const entries = Object.entries(row.deliverables || {});
        if (!entries.length) return <span className="text-ink-3">—</span>;
        return (
          <div className="flex flex-wrap gap-1.5">
            {entries.map(([platform, count]) => (
              <Tag key={platform}>{`${count}× ${platformLabel(String(platform).toUpperCase())}`}</Tag>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      align: 'right',
      render: (row) => <span className="text-ink-2">{formatDate(row.deadline)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monetisation"
        title="Campaigns"
        subtitle="Multi-asset partnership campaigns, budgets and contract deadlines."
        icon={Megaphone}
        action={
          <>
            <Badge tone="brand" size="sm">
              {active.length} active
            </Badge>
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              New campaign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active campaigns" value={String(active.length)} unit="live" caption="Currently in market" icon={Megaphone} />
        <MetricCard label="Committed budget" value={money(committed)} caption="Across all campaigns" icon={Banknote} tone="success" />
        <MetricCard label="Average campaign" value={money(average)} caption="Mean contract size" icon={Target} tone="info" />
        <MetricCard label="Next deadline" value={formatDate(upcoming)} caption="Earliest contract date" icon={CalendarClock} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <DataTable
          className="xl:col-span-3"
          columns={columns}
          rows={campaigns}
          empty={
            <EmptyState
              icon={Megaphone}
              title="No campaigns yet"
              description="Bundle deliverables and a budget into a campaign to track the whole partnership."
              action={
                <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                  Create campaign
                </Button>
              }
            />
          }
        />

        <SectionCard title="How campaigns work" subtitle="From brief to invoice" icon={Target}>
          <ol className="space-y-3">
            {[
              'Agree the deliverable mix with the sponsor.',
              'Define the budget and contract deadline.',
              'Schedule the assets through the publishing queue.',
              'Invoice once the campaign marks delivered.',
            ].map((step, index) => (
              <li key={step} className="cs-inset flex items-start gap-2.5 px-3.5 py-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill cs-gradient-brand text-caption font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-caption leading-relaxed text-ink-2">{step}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New campaign"
        subtitle="Bundle deliverables under one sponsor contract."
        icon={Megaphone}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="campaign-form" size="sm" icon={Plus} loading={saving}>
              Create campaign
            </Button>
          </>
        }
      >
        <form id="campaign-form" onSubmit={handleCreate} className="space-y-4">
          <Field label="Campaign title" htmlFor="campaign-title" required>
            <Input
              id="campaign-title"
              value={draft.title}
              placeholder="Supabase launch series"
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </Field>

          <Field label="Brand sponsor" htmlFor="campaign-brand" required>
            <Input
              id="campaign-brand"
              value={draft.brandName}
              placeholder="Supabase"
              onChange={(event) => setDraft({ ...draft, brandName: event.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Budget (USD)" htmlFor="campaign-budget">
              <Input
                id="campaign-budget"
                type="number"
                min="0"
                value={draft.budget}
                placeholder="12000"
                onChange={(event) => setDraft({ ...draft, budget: event.target.value })}
              />
            </Field>

            <Field label="Contract deadline" htmlFor="campaign-deadline">
              <Input
                id="campaign-deadline"
                type="date"
                value={draft.deadline}
                onChange={(event) => setDraft({ ...draft, deadline: event.target.value })}
              />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
