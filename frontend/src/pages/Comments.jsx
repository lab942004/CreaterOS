import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, MessageSquare, Reply, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Form';
import { SegmentedControl } from '../components/ui/Tabs';
import { UserChip } from '../components/ui/Avatar';
import { PlatformMark } from '../components/ui/Platform';
import { SkeletonCard, PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useToast } from '../components/ui/ToastProvider';

const SENTIMENT_TONE = { POSITIVE: 'success', NEGATIVE: 'error', TOXIC: 'error', NEUTRAL: 'neutral' };

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'positive', label: 'Positive' },
  { value: 'toxic', label: 'Needs action' },
];

export default function Comments() {
  const { toast } = useToast();

  const [comments, setComments] = useState([]);
  const [replyInput, setReplyInput] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getComments();
      setComments(res.comments || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const stats = useMemo(() => {
    const total = comments.length;
    const unanswered = comments.filter((c) => !c.isAnswered).length;
    const positive = comments.filter((c) => c.sentiment === 'POSITIVE').length;
    const toxic = comments.filter((c) => c.sentiment === 'TOXIC' || c.sentiment === 'NEGATIVE').length;
    return { total, unanswered, positive, toxic };
  }, [comments]);

  const visible = useMemo(() => {
    if (filter === 'unanswered') return comments.filter((c) => !c.isAnswered);
    if (filter === 'positive') return comments.filter((c) => c.sentiment === 'POSITIVE');
    if (filter === 'toxic') return comments.filter((c) => c.sentiment === 'TOXIC' || c.sentiment === 'NEGATIVE');
    return comments;
  }, [comments, filter]);

  const handleReply = async (id) => {
    const text = (replyInput[id] || '').trim();
    if (!text) return;
    setBusyId(id);
    try {
      await api.replyComment(id, text);
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, reply: text, isAnswered: true } : c)));
      setReplyInput((prev) => ({ ...prev, [id]: '' }));
      toast({ tone: 'success', title: 'Reply sent' });
    } catch (err) {
      toast({ tone: 'error', title: 'Reply failed', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleHide = async (id) => {
    setBusyId(id);
    try {
      await api.hideComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast({ tone: 'success', title: 'Comment hidden' });
    } catch (err) {
      toast({ tone: 'error', title: 'Could not hide comment', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <PageLoader label="Reading the comment stream…" />;
  if (error) {
    return (
      <ErrorState
        title="Comments unavailable"
        description={error.message || 'We could not load your comment stream.'}
        onRetry={loadComments}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Community"
        title="Comments intelligence"
        subtitle="Sentiment analysis, unanswered enquiries and automated spam filtering."
        icon={MessageSquare}
        action={
          <>
            <Badge tone="neutral">{`${stats.total} comments`}</Badge>
            <Badge tone="warning">{`${stats.unanswered} unanswered`}</Badge>
            <Badge tone="error">{`${stats.toxic} need action`}</Badge>
          </>
        }
      />

      <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />

      {visible.length ? (
        <div className="space-y-4">
          {visible.map((cm) => (
            <Card key={cm.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <UserChip name={cm.authorName} meta={cm.platform} avatar={cm.avatar} />
                  <PlatformMark platform={cm.platform} size={20} />
                </div>

                <Badge tone={SENTIMENT_TONE[cm.sentiment] || 'neutral'} size="sm">
                  {cm.sentiment || 'NEUTRAL'}
                </Badge>
              </div>

              <p className="mt-3.5 border-l-2 border-line-2 pl-3.5 text-label leading-relaxed text-ink-2">
                “{cm.text}”
              </p>

              {cm.reply ? (
                <div className="cs-ai-surface mt-3.5 flex items-start gap-3 rounded-xl px-4 py-3">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-caption font-semibold text-brand">Your reply</p>
                    <p className="mt-0.5 text-caption leading-relaxed text-ink-2">{cm.reply}</p>
                  </div>
                </div>
              ) : null}

              {!cm.isAnswered ? (
                <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
                  <Input
                    value={replyInput[cm.id] || ''}
                    onChange={(e) => setReplyInput((prev) => ({ ...prev, [cm.id]: e.target.value }))}
                    placeholder="Write an instant reply…"
                    aria-label={`Reply to ${cm.authorName}`}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ai"
                      size="md"
                      icon={Reply}
                      loading={busyId === cm.id}
                      disabled={!(replyInput[cm.id] || '').trim()}
                      onClick={() => handleReply(cm.id)}
                    >
                      Reply
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      icon={EyeOff}
                      onClick={() => handleHide(cm.id)}
                      className="hover:text-error"
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3.5 text-caption text-ink-3">Answered — no further action needed.</p>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={filter === 'toxic' ? ShieldAlert : MessageSquare}
            title={filter === 'all' ? 'No comments yet' : 'Nothing in this view'}
            description={
              filter === 'all'
                ? 'Once a post goes live, the whole comment stream lands here with sentiment already scored.'
                : 'Switch filters to see the rest of the comment stream.'
            }
          />
        </Card>
      )}
    </div>
  );
}
