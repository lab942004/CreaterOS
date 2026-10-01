import React, { useCallback, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformBadge } from '../components/ui/Platform';

export default function PublishingQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublishingQueue();
      setQueue(res.queue || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  if (loading) return <PageLoader label="Loading the publishing queue…" />;
  if (error) {
    return (
      <ErrorState
        title="Queue unavailable"
        description={error.message || 'We could not load the publishing queue.'}
        onRetry={loadQueue}
      />
    );
  }

  const columns = [
    {
      key: 'title',
      header: 'Queued asset',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-label font-semibold text-ink">{row.title}</p>
          <p className="mt-0.5 text-caption text-ink-3">{row.type || 'POST'}</p>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Channel',
      render: (row) => <PlatformBadge platform={row.platform} size="sm" />,
    },
    {
      key: 'scheduledAt',
      header: 'Dispatch window',
      render: (row) =>
        row.scheduledAt ? (
          <span className="text-caption text-ink-2">{new Date(row.scheduledAt).toLocaleString()}</span>
        ) : (
          <span className="text-caption text-ink-3">Awaiting a window</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <Button to={`/content/${row.id}`} variant="ghost" size="sm">
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Publishing queue"
        subtitle="Upcoming automated releases pending background dispatch."
        icon={Send}
        action={<Badge tone={queue.length ? 'info' : 'neutral'}>{`${queue.length} pending`}</Badge>}
      />

      {queue.length ? (
        <DataTable columns={columns} rows={queue} />
      ) : (
        <EmptyState
          icon={Send}
          title="Queue is clear"
          description="Nothing is waiting to publish. Schedule a post from the Composer and it will appear here until dispatch."
          action={
            <Button to="/composer" variant="primary" size="sm">
              Schedule a post
            </Button>
          }
        />
      )}
    </div>
  );
}
