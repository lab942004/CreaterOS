import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Banknote, Handshake, Hourglass, Plus, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Field, Input, Select, TextArea } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Tabs } from '../components/ui/Tabs';
import { Tag } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const STAGES = ['LEAD', 'NEGOTIATION', 'CONTRACT', 'DELIVERED', 'PAID'];
const PAYMENT_STATES = ['PENDING', 'INVOICED', 'PAID'];
const CLOSED_STAGES = ['CONTRACT', 'DELIVERED', 'PAID'];

const money = (value) => (typeof value === 'number' ? `$${value.toLocaleString()}` : '—');

const emptyDraft = {
  brandName: '',
  dealValue: '',
  contactPerson: '',
  contactEmail: '',
  stage: 'LEAD',
  paymentStatus: 'PENDING',
  deliverables: '',
};

export default function BrandDeals() {
  const { toast } = useToast();
  const [deals, setDeals] = useState([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [stage, setStage] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const loadDeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDeals();
      setDeals(res.deals || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.brandName.trim()) {
      toast({ title: 'Brand name is required', tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.createDeal({
        brandName: draft.brandName.trim(),
        dealValue: parseFloat(draft.dealValue) || 5000,
        contactPerson: draft.contactPerson.trim(),
        contactEmail: draft.contactEmail.trim(),
        stage: draft.stage,
        paymentStatus: draft.paymentStatus,
        deliverables: draft.deliverables
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      });
      setDeals((prev) => [res.deal, ...prev]);
      setDraft(emptyDraft);
      setModalOpen(false);
      toast({ title: 'Deal added to the pipeline', description: res.deal?.brandName, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not create the deal', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const patchDeal = async (deal, changes) => {
    setUpdatingId(deal.id);
    try {
      const res = await api.updateDeal(deal.id, changes);
      setDeals((prev) => prev.map((item) => (item.id === deal.id ? res.deal : item)));
      toast({ title: 'Deal updated', description: `${res.deal?.brandName} · ${Object.keys(changes)[0]}`, tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not update the deal', description: err.message, tone: 'error' });
    } finally {
      setUpdatingId(null);
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'ALL', label: 'All', count: deals.length },
      ...STAGES.map((item) => ({
        id: item,
        label: item.charAt(0) + item.slice(1).toLowerCase(),
        count: deals.filter((deal) => deal.stage === item).length,
      })),
    ],
    [deals]
  );

  const visible = stage === 'ALL' ? deals : deals.filter((deal) => deal.stage === stage);

  const pipelineValue = deals.reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
  const contractedValue = deals
    .filter((deal) => CLOSED_STAGES.includes(deal.stage))
    .reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
  const outstanding = deals
    .filter((deal) => deal.paymentStatus !== 'PAID')
    .reduce((sum, deal) => sum + (deal.dealValue || 0), 0);
  const awaitingDecision = deals.filter((deal) => deal.stage === 'LEAD' || deal.stage === 'NEGOTIATION').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Monetisation"
          title="Brand deals CRM"
          subtitle="Pipeline tracking, contract deliverables and payment collection."
          icon={Handshake}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} rows={3} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Deals unavailable"
        description={error.message || 'We could not load the brand deal pipeline.'}
        onRetry={loadDeals}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monetisation"
        title="Brand deals CRM"
        subtitle="Pipeline tracking, contract deliverables and payment collection in one board."
        icon={Handshake}
        action={
          <>
            <Badge tone="neutral" size="sm">
              {deals.length} {deals.length === 1 ? 'deal' : 'deals'}
            </Badge>
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              New deal
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pipeline value" value={money(pipelineValue)} caption="All open and closed deals" icon={Wallet} />
        <MetricCard label="Contracted" value={money(contractedValue)} caption="Signed, delivered or paid" icon={Handshake} tone="success" />
        <MetricCard label="Awaiting payment" value={money(outstanding)} caption="Invoiced or still pending" icon={Banknote} tone="warning" />
        <MetricCard label="Needs a decision" value={String(awaitingDecision)} unit="deals" caption="Leads and negotiations" icon={Hourglass} tone="info" />
      </div>

      <Tabs items={tabs} value={stage} onChange={setStage} />

      {visible.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((deal) => (
            <Card key={deal.id} hover className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-label font-semibold text-ink">{deal.brandName}</h3>
                  <p className="mt-0.5 text-caption text-ink-3">{deal.contactPerson || 'Contact pending'}</p>
                </div>
                <StatusBadge status={deal.stage} size="sm" />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="text-title font-bold tracking-tight text-ink">{money(deal.dealValue)}</span>
                <StatusBadge status={deal.paymentStatus} size="sm" />
              </div>

              {deal.deliverables?.length ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {deal.deliverables.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2">
                <Field label="Stage" htmlFor={`stage-${deal.id}`}>
                  <Select
                    id={`stage-${deal.id}`}
                    value={deal.stage}
                    disabled={updatingId === deal.id}
                    onChange={(event) => patchDeal(deal, { stage: event.target.value })}
                  >
                    {STAGES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Payment" htmlFor={`payment-${deal.id}`}>
                  <Select
                    id={`payment-${deal.id}`}
                    value={deal.paymentStatus}
                    disabled={updatingId === deal.id}
                    onChange={(event) => patchDeal(deal, { paymentStatus: event.target.value })}
                  >
                    {PAYMENT_STATES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {deal.contactEmail ? (
                <p className="mt-3 truncate text-caption text-ink-3">{deal.contactEmail}</p>
              ) : null}
              {deal.dueDate ? (
                <p className="mt-1 text-caption text-ink-3">
                  Due {new Date(deal.dueDate).toLocaleDateString()}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0">
          <EmptyState
            icon={Handshake}
            title={stage === 'ALL' ? 'No deals in the pipeline' : `Nothing at the ${stage.toLowerCase()} stage`}
            description="Add a sponsor conversation to start tracking deliverables and payments."
            action={
              <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                Add deal
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New brand deal"
        subtitle="Pipeline entry for a sponsor conversation."
        icon={Handshake}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="deal-form" size="sm" icon={Plus} loading={saving}>
              Add deal
            </Button>
          </>
        }
      >
        <form id="deal-form" onSubmit={handleCreate} className="space-y-4">
          <Field label="Brand sponsor" htmlFor="deal-brand" required>
            <Input
              id="deal-brand"
              value={draft.brandName}
              placeholder="Supabase"
              onChange={(event) => setDraft({ ...draft, brandName: event.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Deal value (USD)" htmlFor="deal-value">
              <Input
                id="deal-value"
                type="number"
                min="0"
                value={draft.dealValue}
                placeholder="8500"
                onChange={(event) => setDraft({ ...draft, dealValue: event.target.value })}
              />
            </Field>

            <Field label="Stage" htmlFor="deal-stage">
              <Select
                id="deal-stage"
                value={draft.stage}
                onChange={(event) => setDraft({ ...draft, stage: event.target.value })}
              >
                {STAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Contact person" htmlFor="deal-contact">
              <Input
                id="deal-contact"
                value={draft.contactPerson}
                placeholder="Sarah Jenkins"
                onChange={(event) => setDraft({ ...draft, contactPerson: event.target.value })}
              />
            </Field>

            <Field label="Contact email" htmlFor="deal-email">
              <Input
                id="deal-email"
                type="email"
                value={draft.contactEmail}
                placeholder="sarah@brand.io"
                onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })}
              />
            </Field>
          </div>

          <Field label="Payment status" htmlFor="deal-payment">
            <Select
              id="deal-payment"
              value={draft.paymentStatus}
              onChange={(event) => setDraft({ ...draft, paymentStatus: event.target.value })}
            >
              {PAYMENT_STATES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Deliverables" htmlFor="deal-deliverables" hint="One deliverable per line.">
            <TextArea
              id="deal-deliverables"
              rows={3}
              value={draft.deliverables}
              placeholder={'1x Video Integration\n2x Twitter Threads'}
              onChange={(event) => setDraft({ ...draft, deliverables: event.target.value })}
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
