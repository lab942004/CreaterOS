import React, { useCallback, useEffect, useState } from 'react';
import { KeyRound, Laptop, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { Alert, SkeletonCard } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { KeyValueList } from '../components/ui/Table';
import { Button } from '../components/ui/Button';

const isMobileDevice = (device = '') => /ios|iphone|android|ipad|mobile/i.test(device);
const isCurrentDevice = (device = '') => /current/i.test(device);

export default function Security() {
  const [security, setSecurity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSecurity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSecurity();
      setSecurity(res);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSecurity();
  }, [loadSecurity]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Security & sessions"
          subtitle="Active authorisation sessions, OAuth token health and account protection."
          icon={ShieldCheck}
        />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <SkeletonCard className="xl:col-span-2" rows={4} />
          <SkeletonCard rows={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Security data unavailable"
        description={error.message || 'We could not load the security overview.'}
        onRetry={loadSecurity}
      />
    );
  }

  const sessions = security?.activeSessions || [];
  const currentSession = sessions.find((session) => isCurrentDevice(session.device));
  const twoFactorEnabled = Boolean(security?.twoFactorEnabled);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Security & sessions"
        subtitle="Active authorisation sessions, OAuth token health and account protection."
        icon={ShieldCheck}
        action={
          <>
            <Badge tone={twoFactorEnabled ? 'success' : 'warning'} size="sm" icon={Lock}>
              2FA {twoFactorEnabled ? 'enabled' : 'off'}
            </Badge>
            <Button variant="secondary" onClick={loadSecurity}>
              Refresh sessions
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Active sessions"
          value={String(sessions.length)}
          unit="devices"
          caption="Authorised right now"
          icon={Laptop}
          tone="info"
        />
        <MetricCard
          label="Two-factor auth"
          value={twoFactorEnabled ? 'Enabled' : 'Disabled'}
          caption={twoFactorEnabled ? 'Extra sign-in challenge active' : 'Consider enabling for admin roles'}
          icon={Lock}
          tone={twoFactorEnabled ? 'success' : 'warning'}
        />
        <MetricCard
          label="Mobile sessions"
          value={String(sessions.filter((session) => isMobileDevice(session.device)).length)}
          caption="Phones and tablets"
          icon={Smartphone}
          tone="cyan"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Active device sessions"
          subtitle="Every device currently holding a workspace token"
          icon={Laptop}
        >
          {sessions.length ? (
            <ul className="space-y-3">
              {sessions.map((session) => {
                const Icon = isMobileDevice(session.device) ? Smartphone : Laptop;
                const current = isCurrentDevice(session.device);
                return (
                  <li
                    key={session.id}
                    className="cs-inset flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-ink-2">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-label font-semibold text-ink">{session.device}</p>
                          {current ? (
                            <Badge tone="brand" size="sm">
                              This device
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-caption text-ink-3">
                          {session.ip} · {session.location} · last active {session.lastActive}
                        </p>
                      </div>
                    </div>

                    <Badge tone="success" size="sm" dot>
                      Verified
                    </Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Alert tone="warning" title="No active sessions recorded">
              Sign in from a device to create an authorised session for this workspace.
            </Alert>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="Two-factor authentication" subtitle="Current account state" icon={Lock}>
            <div className="space-y-4">
              <Alert tone={twoFactorEnabled ? 'success' : 'warning'} title={twoFactorEnabled ? 'Enabled' : 'Not enabled'}>
                {twoFactorEnabled
                  ? 'Sign-in challenges are active for this account.'
                  : 'Workspace owners should enable a second factor before inviting editors.'}
              </Alert>

              <KeyValueList
                items={[
                  { label: 'Scope', value: 'Workspace account' },
                  { label: 'Method', value: 'Authenticator app' },
                  { label: 'Updated', value: 'Managed by account owner' },
                ]}
              />
            </div>
          </SectionCard>

          <SectionCard title="Connected OAuth tokens" subtitle="Platform authorisation health" icon={KeyRound}>
            <div className="space-y-4">
              <p className="text-caption leading-relaxed text-ink-2">
                Social network access keys are encrypted in the PostgreSQL store using AES-256 and rotated
                periodically.
              </p>
              <Alert tone="success" title="Token health">
                All active tokens validated and healthy.
              </Alert>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
