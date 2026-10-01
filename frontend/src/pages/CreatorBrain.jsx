import React, { useCallback, useEffect, useState } from 'react';
import { Brain, Compass, Database, ListChecks, Palette, Save, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, Input, TextArea } from '../components/ui/Form';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { KeyValueList } from '../components/ui/Table';
import { Tag } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

/** Splits a comma or newline separated string into a clean array. */
const splitList = (value = '') =>
  String(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function CreatorBrain() {
  const { toast } = useToast();
  const [brain, setBrain] = useState(null);
  const [pillarsText, setPillarsText] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBrain = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBrain();
      const next = res.brain || {};
      setBrain(next);
      setPillarsText((next.pillars || []).join(', '));
      setRulesText((next.rules || []).join('\n'));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrain();
  }, [loadBrain]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!brain) return;
    setSaving(true);
    try {
      const payload = { ...brain, pillars: splitList(pillarsText), rules: splitList(rulesText) };
      const res = await api.updateBrain(payload);
      setBrain(res.brain || payload);
      toast({
        title: 'Creator brain saved',
        description: 'Every AI surface now reasons from this context.',
        tone: 'ai',
      });
    } catch (err) {
      toast({ title: 'Could not save the brain', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading creator brain…" />;
  if (error) {
    return (
      <ErrorState
        title="Brain unavailable"
        description={error.message || 'We could not load the creator brain for this workspace.'}
        onRetry={loadBrain}
      />
    );
  }

  const pillars = splitList(pillarsText);
  const rules = splitList(rulesText);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Creator Intelligence"
        title="Creator brain"
        subtitle="Persistent context and ground truth that governs every AI output in this workspace."
        icon={Brain}
        action={
          <>
            <Badge tone="brand" size="sm" icon={Sparkles}>
              Context synced
            </Badge>
            <Button type="submit" form="brain-form" icon={Save} loading={saving}>
              Save brain
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form id="brain-form" onSubmit={handleSubmit} className="space-y-6 xl:col-span-2">
          <SectionCard title="Positioning" subtitle="Who you speak to and why the channel exists" icon={Target}>
            <div className="space-y-4">
              <Field
                label="Target audience"
                htmlFor="brain-audience"
                hint="Drives angle selection and vocabulary in every draft."
              >
                <Input
                  id="brain-audience"
                  value={brain?.targetAudience || ''}
                  placeholder="Software engineers and tech builders"
                  onChange={(event) => setBrain({ ...brain, targetAudience: event.target.value })}
                />
              </Field>

              <Field
                label="Mission statement"
                htmlFor="brain-mission"
                hint="One sentence the strategist optimises for."
              >
                <TextArea
                  id="brain-mission"
                  rows={3}
                  value={brain?.missionStatement || ''}
                  placeholder="Empower individual creators to wield software leverage."
                  onChange={(event) => setBrain({ ...brain, missionStatement: event.target.value })}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Content pillars" subtitle="Themes the strategist gravitates toward" icon={Compass}>
            <div className="space-y-4">
              <Field label="Pillars" htmlFor="brain-pillars" hint="Comma separated — three to five works best.">
                <Input
                  id="brain-pillars"
                  value={pillarsText}
                  placeholder="AI System Architecture, Creator Monetization"
                  onChange={(event) => setPillarsText(event.target.value)}
                />
              </Field>

              <div className="flex flex-wrap gap-2">
                {pillars.length ? (
                  pillars.map((pillar) => <Tag key={pillar}>{pillar}</Tag>)
                ) : (
                  <p className="text-caption text-ink-3">No pillars defined yet — add one above.</p>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Non-negotiable rules"
            subtitle="One rule per line — enforced on every generation"
            icon={ListChecks}
          >
            <div className="space-y-4">
              <Field label="Rules" htmlFor="brain-rules" hint="Guardrails the AI must never break.">
                <TextArea
                  id="brain-rules"
                  rows={5}
                  value={rulesText}
                  placeholder={'Provide real code.\nKeep intro hooks under 5s.'}
                  onChange={(event) => setRulesText(event.target.value)}
                />
              </Field>

              {rules.length ? (
                <ol className="space-y-2">
                  {rules.map((rule, index) => (
                    <li key={rule} className="cs-inset flex items-start gap-2.5 px-3.5 py-2.5">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill cs-gradient-brand text-caption font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="text-label leading-relaxed text-ink-2">{rule}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          </SectionCard>
        </form>

        <div className="space-y-6">
          <SectionCard title="Ground truth" subtitle="What the AI reads before it writes" icon={ShieldCheck}>
            <KeyValueList
              items={[
                { label: 'Content pillars', value: String(pillars.length) },
                { label: 'Enforced rules', value: String(rules.length) },
                { label: 'Context scope', value: 'Workspace-wide' },
                { label: 'Sync state', value: 'Synchronised' },
              ]}
            />
          </SectionCard>

          <SectionCard title="Connected context" subtitle="Keep the brain fed" icon={Database}>
            <div className="space-y-2.5">
              <Button variant="secondary" full to="/memory" icon={Database}>
                Creator memory
              </Button>
              <Button variant="ghost" full to="/brand-kit" icon={Palette}>
                Brand kit
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
