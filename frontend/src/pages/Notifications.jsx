import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, Inbox } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { MetricCard } from '../components/ui/MetricCard';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/ToastProvider';

const TYPE_TONES = {
  AI: 'brand',
  PUBLISHING: 'info',
  AUTOPILOT: 'cyan',
  REVENUE: 'success',
  SYSTEM: 'neutral',
};

const timeAgo = (value) => {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
};

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast({ title: 'All notifications marked as read', tone: 'success' });
    } catch (err) {
      toast({ title: 'Could not update notifications', description: err.message, tone: 'error' });
    } finally {
      setMarking(false);
    }
  };

  const unread = notifications.filter((item) => !item.isRead);

  const tabs = useMemo(() => {
    const types = [...new Set(notifications.map((item) => item.type).filter(Boolean))];
    return [
      { id: 'ALL', label: 'All', count: notifications.length },
      { id: 'UNREAD', label: 'Unread', count: unread.length },
      ...types.map((type) => ({
        id: type,
        label: type.charAt(0) + type.slice(1).toLowerCase(),
        count: notifications.filter((item) => item.type === type).length,
      })),
    ];
  }, [notifications, unread]);

  const visible = notifications.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'UNREAD') return !item.isRead;
    return item.type === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Workspace"
          title="Notifications"
          subtitle="Live operational alerts across publishing, autopilot and sponsorship milestones."
          icon={Bell}
        />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonCard key={index} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Notifications unavailable"
        description={error.message || 'We could not load your notification feed.'}
        onRetry={loadNotifications}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        subtitle="Live operational alerts across publishing, autopilot and sponsorship milestones."
        icon={Bell}
        action={
          <>
            <Badge tone={unread.length ? 'brand' : 'neutral'} size="sm" dot={Boolean(unread.length)}>
              {unread.length} unread
            </Badge>
            <Button
              variant="secondary"
              icon={CheckCheck}
              loading={marking}
              disabled={!unread.length}
              onClick={handleMarkAll}
            >
              Mark all as read
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total alerts"
          value={String(notifications.length)}
          caption="Across every workspace signal"
          icon={Bell}
        />
        <MetricCard
          label="Unread"
          value={String(unread.length)}
          caption="Waiting on your attention"
          icon={Inbox}
          tone={unread.length ? 'warning' : 'success'}
        />
        <MetricCard
          label="Latest alert"
          value={notifications[0] ? timeAgo(notifications[0].createdAt) : '—'}
          caption={notifications[0]?.title || 'No alerts yet'}
          icon={CheckCheck}
          tone="info"
        />
      </div>

      <Tabs items={tabs} value={filter} onChange={setFilter} />

      {visible.length ? (
        <ul className="space-y-3">
          {visible.map((item) => (
            <li key={item.id}>
              <Card
                hover
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${
                  item.isRead ? '' : 'border-brand-ring'
                }`}
              >
                <div className="flex min-w-0 gap-3">
                  <span
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      item.isRead ? 'bg-surface-2 text-ink-3' : 'bg-brand-soft text-brand'
                    }`}
                  >
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={TYPE_TONES[item.type] || 'neutral'} size="sm">
                        {item.type || 'SYSTEM'}
                      </Badge>
                      {!item.isRead ? (
                        <span className="text-caption font-semibold text-brand">Unread</span>
                      ) : null}
                      <span className="text-caption text-ink-3">{timeAgo(item.createdAt)}</span>
                    </div>

                    <h3 className="mt-1.5 text-label font-semibold text-ink">{item.title}</h3>
                    <p className="mt-0.5 text-caption leading-relaxed text-ink-2">{item.message}</p>
                  </div>
                </div>

                {item.link ? (
                  <Button variant="secondary" size="sm" to={item.link} iconRight={ExternalLink}>
                    Open
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="p-0">
          <EmptyState
            icon={Inbox}
            title={filter === 'UNREAD' ? 'You are all caught up' : 'Nothing to report'}
            description={
              filter === 'UNREAD'
                ? 'Every alert in this workspace has been reviewed.'
                : 'Operational alerts appear here as autopilot, publishing and sponsorship events happen.'
            }
          />
        </Card>
      )}
    </div>
  );
}
