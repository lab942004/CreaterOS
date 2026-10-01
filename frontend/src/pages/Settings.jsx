import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Save, Settings as SettingsIcon, Sparkles, User } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card, SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Field, Input, Select, TextArea, Toggle } from '../components/ui/Form';
import { ProgressBar } from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { KeyValueList } from '../components/ui/Table';
import { SegmentedControl } from '../components/ui/Tabs';
import { useToast } from '../components/ui/ToastProvider';

const money = (value) => (typeof value === 'number' ? `$${value.toFixed(2)}` : '—');

const CREATIVITY_OPTIONS = [
  { value: '0.3', label: 'Precise' },
  { value: '0.7', label: 'Balanced' },
  { value: '1', label: 'Exploratory' },
];

export default function Settings() {
  const { toast } = useToast();
  const [section, setSection] = useState('account');
  const [account, setAccount] = useState({ name: '', avatar: '' });
  const [ai, setAi] = useState({ defaultTone: '', primaryModel: '', creativityLevel: 0.7, autoClipDetection: true });
  const [workspace, setWorkspace] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, billingRes] = await Promise.all([
        api.getSettings(),
        api.getBilling().catch(() => null),
      ]);
      const user = settingsRes?.user || {};
      setAccount({ name: user.name || '', avatar: user.avatar || '' });
      setAi({
        defaultTone: settingsRes?.aiSettings?.defaultTone || '',
        primaryModel: settingsRes?.aiSettings?.primaryModel || '',
        creativityLevel: settingsRes?.aiSettings?.creativityLevel ?? 0.7,
        autoClipDetection: settingsRes?.aiSettings?.autoClipDetection ?? true,
      });
      setWorkspace(settingsRes?.workspace || null);
      setBilling(billingRes);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.updateAccountSettings({ name: account.name, avatar: account.avatar }),
        api.updateAISettings(ai),
      ]);
      toast({ title: 'Settings saved', description: 'Account and AI preferences updated.', tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not save settings', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Settings"
          subtitle="Account profile, AI model preferences and subscription."
          icon={SettingsIcon}
        />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SkeletonCard className="xl:col-span-2" rows={5} />
          <SkeletonCard rows={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Settings unavailable"
        description={error.message || 'We could not load your workspace settings.'}
        onRetry={loadSettings}
      />
    );
  }

  const usage = billing?.usage || {};

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        subtitle="Account profile, AI model preferences and subscription plan."
        icon={SettingsIcon}
        action={
          <>
            <Badge tone="brand" size="sm">
              {billing?.currentPlan || 'CreatorOS'}
            </Badge>
            {section === 'billing' ? null : (
              <Button type="submit" form="settings-form" icon={Save} loading={saving}>
                Save changes
              </Button>
            )}
          </>
        }
      />

      <SegmentedControl
        options={[
          { value: 'account', label: 'Account' },
          { value: 'ai', label: 'AI preferences' },
          { value: 'billing', label: 'Plan & billing' },
        ]}
        value={section}
        onChange={setSection}
      />

      {section === 'billing' ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SectionCard
            className="xl:col-span-2"
            title={billing?.currentPlan || 'CreatorOS'}
            subtitle={`${money(billing?.price)} / ${(billing?.billingCycle || 'month').toLowerCase()} · renews ${billing?.nextBillingDate || '—'}`}
            icon={CreditCard}
            action={
              <Badge tone="success" size="sm">
                Active
              </Badge>
            }
          >
            <div className="space-y-4">
              <ProgressBar
                label="AI tokens"
                value={usage.aiTokenLimit ? (usage.aiTokensUsed / usage.aiTokenLimit) * 100 : 0}
                hint={`${(usage.aiTokensUsed || 0).toLocaleString()} / ${(usage.aiTokenLimit || 0).toLocaleString()}`}
                tone="brand"
              />
              <ProgressBar
                label="Video minutes"
                value={usage.videoMinutesLimit ? (usage.videoMinutesProcessed / usage.videoMinutesLimit) * 100 : 0}
                hint={`${usage.videoMinutesProcessed || 0} / ${usage.videoMinutesLimit || 0} min`}
                tone="cyan"
              />
              <ProgressBar
                label="Team seats"
                value={usage.teamSeatsLimit ? (usage.teamSeatsUsed / usage.teamSeatsLimit) * 100 : 0}
                hint={`${usage.teamSeatsUsed || 0} / ${usage.teamSeatsLimit || 0} seats`}
                tone="info"
              />

              <KeyValueList
                items={[
                  {
                    label: 'Payment method',
                    value: billing?.paymentMethod
                      ? `${billing.paymentMethod.brand} •••• ${billing.paymentMethod.last4}`
                      : 'Not set',
                  },
                  {
                    label: 'Expires',
                    value: billing?.paymentMethod
                      ? `${billing.paymentMethod.expMonth}/${billing.paymentMethod.expYear}`
                      : '—',
                  },
                  { label: 'Billing cycle', value: billing?.billingCycle || 'Monthly' },
                ]}
              />
            </div>
          </SectionCard>

          <SectionCard title="Invoices" subtitle="Recent billing history" icon={CreditCard}>
            {billing?.invoices?.length ? (
              <ul className="space-y-2.5">
                {billing.invoices.map((invoice) => (
                  <li
                    key={invoice.id}
                    className="cs-inset flex items-center justify-between gap-3 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-label font-semibold text-ink">{money(invoice.amount)}</p>
                      <p className="text-caption text-ink-3">{invoice.date}</p>
                    </div>
                    <Badge tone="success" size="sm">
                      {invoice.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-caption text-ink-3">No invoices issued yet.</p>
            )}
          </SectionCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <form id="settings-form" onSubmit={handleSave} className="space-y-6 xl:col-span-2">
            {section === 'account' ? (
              <SectionCard
                title="Account information"
                subtitle="How you appear across the workspace"
                icon={User}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar src={account.avatar} name={account.name} size="xl" ring />
                    <div className="min-w-0">
                      <p className="text-label font-semibold text-ink">{account.name || 'Unnamed creator'}</p>
                      <p className="text-caption text-ink-3">{workspace?.name || 'CreatorOS workspace'}</p>
                    </div>
                  </div>

                  <Field label="Display name" htmlFor="settings-name">
                    <Input
                      id="settings-name"
                      value={account.name}
                      placeholder="Alex Rivera"
                      onChange={(event) => setAccount({ ...account, name: event.target.value })}
                    />
                  </Field>

                  <Field label="Avatar URL" htmlFor="settings-avatar" hint="Square image, at least 256×256.">
                    <Input
                      id="settings-avatar"
                      value={account.avatar}
                      placeholder="https://images.example.com/avatar.jpg"
                      onChange={(event) => setAccount({ ...account, avatar: event.target.value })}
                    />
                  </Field>
                </div>
              </SectionCard>
            ) : (
              <SectionCard
                title="AI preferences"
                subtitle="Defaults applied to every generation"
                icon={Sparkles}
              >
                <div className="space-y-4">
                  <Field label="Default synthesis tone" htmlFor="settings-tone">
                    <TextArea
                      id="settings-tone"
                      rows={2}
                      value={ai.defaultTone}
                      placeholder="Authoritative, practical, energetic"
                      onChange={(event) => setAi({ ...ai, defaultTone: event.target.value })}
                    />
                  </Field>

                  <Field label="Primary model" htmlFor="settings-model">
                    <Input
                      id="settings-model"
                      value={ai.primaryModel}
                      placeholder="GPT-4o Mini"
                      onChange={(event) => setAi({ ...ai, primaryModel: event.target.value })}
                    />
                  </Field>

                  <Field label="Creativity level" hint="Higher values explore more unusual angles.">
                    <Select
                      value={String(ai.creativityLevel)}
                      aria-label="Creativity level"
                      onChange={(event) => setAi({ ...ai, creativityLevel: Number(event.target.value) })}
                    >
                      {CREATIVITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.value})
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <div className="cs-inset px-4 py-3.5">
                    <Toggle
                      checked={Boolean(ai.autoClipDetection)}
                      onChange={(next) => setAi({ ...ai, autoClipDetection: next })}
                      label="Automatic clip detection"
                      description="Scan every uploaded video for high-retention vertical clips."
                    />
                  </div>
                </div>
              </SectionCard>
            )}
          </form>

          <div className="space-y-6">
            <SectionCard title="Workspace" subtitle="Read-only details" icon={SettingsIcon}>
              <KeyValueList
                items={[
                  { label: 'Workspace', value: workspace?.name || 'CreatorOS' },
                  { label: 'Plan', value: billing?.currentPlan || '—' },
                  { label: 'Members', value: `${usage.teamSeatsUsed || 0} of ${usage.teamSeatsLimit || 0} seats` },
                ]}
              />
            </SectionCard>

            <Card className="cs-ai-surface p-5">
              <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Why this matters
              </p>
              <p className="mt-1.5 text-caption leading-relaxed text-ink-2">
                Tone and model settings apply to every draft, script and caption this workspace produces —
                change them once and the whole pipeline follows.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
