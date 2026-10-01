import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Radar, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/Progress';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { PlatformBadge } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

const ACTION_LABEL = {
  create_content: 'Create content',
  turn_into_idea: 'Turn into idea',
};

export default function OpportunityCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOpportunities();
      setOpportunities(res.opportunities || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleAction = async (opp) => {
    setBusyId(opp.id);
    try {
      const res = await api.takeOpportunityAction({ opportunityId: opp.id, actionType: opp.actionType });
      toast({
        tone: 'success',
        title: ACTION_LABEL[opp.actionType] || 'Action executed',
        description: opp.title,
      });
      if (res.redirect) navigate(res.redirect);
    } catch (err) {
      toast({ tone: 'error', title: 'Action failed', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const top = opportunities.reduce(
    (best, opp) => ((opp.impactScore || 0) > (best?.impactScore || 0) ? opp : best),
    null
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth radar"
        title="Opportunity centre"
        subtitle="Algorithmic gaps, audience search spikes and repurposing plays ranked by impact."
        icon={Compass}
        action={
          <Badge tone="brand" icon={Radar}>
            {`${opportunities.length} live opportunities`}
          </Badge>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} rows={3} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Opportunity radar offline"
          description={error.message || 'We could not load the opportunity feed.'}
          onRetry={loadOpportunities}
        />
      ) : opportunities.length ? (
        <>
          {top ? (
            <Card className="cs-ai-surface p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Highest impact right now
                  </p>
                  <h2 className="mt-1 text-title font-bold text-ink">{top.title}</h2>
                  <p className="mt-1 text-label leading-relaxed text-ink-2">{top.description}</p>
                </div>
                <Button
                  variant="ai"
                  size="md"
                  iconRight={ArrowRight}
                  loading={busyId === top.id}
                  onClick={() => handleAction(top)}
                  className="shrink-0"
                >
                  {ACTION_LABEL[top.actionType] || 'Take action'}
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opp) => (
              <Card key={opp.id} hover className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="brand" size="sm">
                    {String(opp.type || 'Opportunity').replace(/_/g, ' ')}
                  </Badge>
                  <PlatformBadge platform={opp.platform} size="sm" />
                </div>

                <h3 className="mt-3 text-label font-bold leading-snug text-ink">{opp.title}</h3>
                <p className="mt-1.5 flex-1 text-caption leading-relaxed text-ink-2">{opp.description}</p>

                <div className="mt-4">
                  <ProgressBar
                    label="Impact score"
                    value={Math.min(opp.impactScore || 0, 100)}
                    hint={`${opp.impactScore ?? 0}%`}
                    tone={(opp.impactScore || 0) >= 90 ? 'success' : 'brand'}
                  />
                </div>

                <div className="mt-4 border-t border-line pt-3.5">
                  <Button
                    variant="soft"
                    size="sm"
                    full
                    iconRight={ArrowRight}
                    loading={busyId === opp.id}
                    onClick={() => handleAction(opp)}
                  >
                    {ACTION_LABEL[opp.actionType] || 'Take action'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <EmptyState
            icon={Radar}
            title="No opportunities detected"
            description="CreatorOS scans your channels and the wider algorithm daily. New plays appear here automatically."
          />
        </Card>
      )}
    </div>
  );
}
