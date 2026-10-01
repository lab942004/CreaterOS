import React, { useCallback, useEffect, useState } from 'react';
import { Cpu, Gauge, Pause, Play, Plus, Timer, Zap } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input, Select, TextArea } from '../components/ui/Form';
import { MetricCard } from '../components/ui/MetricCard';
import { Modal } from '../components/ui/Modal';
import { Timeline } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useToast } from '../components/ui/ToastProvider';

const TRIGGERS = [
  { value: 'NEW_VIDEO_PUBLISHED', label: 'New video published' },
  { value: 'ENGAGEMENT_DROP', label: 'Engagement drops below average' },
  { value: 'TRENDING_TOPIC', label: 'Trending topic detected in my niche' },
  { value: 'COMMENT_RECEIVED', label: 'High-intent comment received' },
  { value: 'SCHEDULE_WINDOW', label: 'Optimal scheduling window opens' },
];

const ACTIONS = [
  { value: 'AI_ANALYZE', label: 'Analyse with AI' },
  { value: 'GENERATE_CLIP', label: 'Generate a clip' },
  { value: 'REPURPOSE', label: 'Repurpose to other networks' },
  { value: 'SCHEDULE_POST', label: 'Schedule a post' },
  { value: 'NOTIFY_TEAM', label: 'Notify the team' },
];

const RUN_TONE = { SUCCESS: 'success', FAILED: 'error', RUNNING: 'brand' };

export default function Autopilot() {
  const { toast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger: TRIGGERS[0].value,
    actionType: ACTIONS[0].value,
  });

  const loadAutopilot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAutopilot();
      setData(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAutopilot();
  }, [loadAutopilot]);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      const res = await api.toggleAutopilotRule(id);
      setData((prev) => ({
        ...prev,
        automations: prev.automations.map((a) => (a.id === id ? res.automation : a)),
      }));
      toast({
        tone: 'success',
        title: res.automation?.isActive ? 'Pipeline resumed' : 'Pipeline paused',
        description: res.automation?.name,
      });
    } catch (err) {
      toast({ tone: 'error', title: 'Could not toggle the pipeline', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const res = await api.createAutopilotRule({
        name: form.name,
        description: form.description,
        trigger: form.trigger,
        conditions: [],
        actions: [{ type: form.actionType }],
      });
      setData((prev) => ({ ...prev, automations: [res.automation, ...(prev?.automations || [])] }));
      setForm({ name: '', description: '', trigger: TRIGGERS[0].value, actionType: ACTIONS[0].value });
      setRuleOpen(false);
      toast({ tone: 'success', title: 'Pipeline armed', description: 'It starts listening immediately.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Could not create the rule', description: err.message });
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <PageLoader label="Booting the autopilot pipeline…" />;
  if (error) {
    return (
      <ErrorState
        title="Autopilot unavailable"
        description={error.message || 'We could not load your automation pipelines.'}
        onRetry={loadAutopilot}
      />
    );
  }

  const { metrics, automations, recentRuns } = data || {};
  const activeCount = (automations || []).filter((a) => a.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Automation"
        title="AI autopilot"
        subtitle="Autonomous triggers, cross-platform repurposing flows and action logs."
        icon={Cpu}
        action={
          <>
            <Badge tone={activeCount ? 'success' : 'neutral'} dot>{`${activeCount} running`}</Badge>
            <Button variant="ai" size="md" icon={Plus} onClick={() => setRuleOpen(true)}>
              New rule
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active pipelines"
          value={String(metrics?.activeAutomations ?? 0)}
          caption="online and listening"
          icon={Zap}
        />
        <MetricCard
          label="Tasks executed today"
          value={String(metrics?.totalRunsToday ?? 0)}
          caption="100% success rate"
          icon={Gauge}
          tone="cyan"
        />
        <MetricCard
          label="Time saved"
          value={String(metrics?.timeSavedHours ?? 0)}
          unit="hrs"
          caption="human labour returned"
          icon={Timer}
          tone="warning"
        />
        <MetricCard
          label="All-time runs"
          value={String(metrics?.allTimeRuns ?? 0)}
          caption="since activation"
          icon={Cpu}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {(automations || []).length ? (
            automations.map((auto) => (
              <Card key={auto.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-label font-bold text-ink">{auto.name}</h3>
                      <Badge tone={auto.isActive ? 'success' : 'neutral'} size="sm">
                        {auto.isActive ? 'RUNNING' : 'PAUSED'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-caption leading-relaxed text-ink-2">{auto.description}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2 text-caption text-ink-3">
                      <span className="inline-flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-brand" aria-hidden="true" />
                        Trigger: <strong className="font-semibold text-ink-2">{auto.trigger}</strong>
                      </span>
                      <span aria-hidden="true">•</span>
                      <span>{`${auto.runsCount ?? 0} runs`}</span>
                      <span aria-hidden="true">•</span>
                      <span>{`${auto.timeSavedMinutes ?? 0} min saved`}</span>
                    </div>
                  </div>

                  <Button
                    variant={auto.isActive ? 'secondary' : 'primary'}
                    size="md"
                    icon={auto.isActive ? Pause : Play}
                    loading={busyId === auto.id}
                    onClick={() => handleToggle(auto.id)}
                    className="shrink-0"
                  >
                    {auto.isActive ? 'Pause' : 'Resume'}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <EmptyState
                icon={Cpu}
                title="No pipelines yet"
                description="Create your first rule and CreatorOS will react to your channel events automatically."
                action={
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setRuleOpen(true)}>
                    New rule
                  </Button>
                }
              />
            </Card>
          )}
        </div>

        <SectionCard title="Recent activity" subtitle="Last five executions" icon={Timer}>
          {recentRuns?.length ? (
            <Timeline
              items={recentRuns.map((run) => ({
                id: run.id,
                title: run.event,
                time: run.executedAt ? new Date(run.executedAt).toLocaleString() : '',
                description: run.error || run.details,
                tone: RUN_TONE[run.status] || 'brand',
              }))}
            />
          ) : (
            <p className="text-caption text-ink-3">No runs recorded yet — triggers will show up here.</p>
          )}
        </SectionCard>
      </div>

      <Modal
        open={ruleOpen}
        onClose={() => setRuleOpen(false)}
        title="New autopilot rule"
        subtitle="When this happens → do this"
        icon={Cpu}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button variant="ai" size="sm" loading={creating} onClick={handleCreateRule}>
              Arm pipeline
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <Field label="Rule name" htmlFor="rule-name" required>
            <Input
              id="rule-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Clip every longform upload for Shorts"
            />
          </Field>

          <Field label="Description" htmlFor="rule-description" hint="What should the team expect this pipeline to do?">
            <TextArea
              id="rule-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Detect the strongest moment in each new upload and cut a vertical clip."
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Trigger" htmlFor="rule-trigger">
              <Select
                id="rule-trigger"
                value={form.trigger}
                onChange={(e) => setForm((prev) => ({ ...prev, trigger: e.target.value }))}
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Action" htmlFor="rule-action">
              <Select
                id="rule-action"
                value={form.actionType}
                onChange={(e) => setForm((prev) => ({ ...prev, actionType: e.target.value }))}
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
