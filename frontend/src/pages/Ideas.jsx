import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Lightbulb, Plus, Sparkles, Star, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Form';
import { SegmentedControl } from '../components/ui/Tabs';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { cx } from '../components/ui/cn';
import { useToast } from '../components/ui/ToastProvider';

const PLATFORMS = ['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN'];
const NICHES = ['Tech', 'Business', 'Finance', 'Fitness', 'Gaming', 'Education', 'Design'];

export default function Ideas() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [ideas, setIdeas] = useState([]);
  const [topic, setTopic] = useState('');
  const [niche, setNiche] = useState('Tech');
  const [platform, setPlatform] = useState('YOUTUBE');
  const [view, setView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const loadIdeas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getIdeas();
      setIdeas(res.ideas || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIdeas();
  }, [loadIdeas]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateIdeas({ topic, niche, platform });
      setIdeas((prev) => [...(res.ideas || []), ...prev]);
      setTopic('');
      toast({
        tone: 'ai',
        title: 'Ideas synthesised',
        description: `${res.ideas?.length || 0} new concepts added to the top of your board.`,
      });
    } catch (err) {
      toast({ tone: 'error', title: 'Generation failed', description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleFavorite = async (id) => {
    try {
      const res = await api.favoriteIdea(id);
      setIdeas((prev) => prev.map((i) => (i.id === id ? res.idea : i)));
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update favourite', description: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteIdea(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast({ tone: 'success', title: 'Idea removed' });
    } catch (err) {
      toast({ tone: 'error', title: 'Could not delete idea', description: err.message });
    }
  };

  const handleConvertToContent = async (id) => {
    setBusyId(id);
    try {
      const res = await api.convertIdeaToContent(id);
      toast({ tone: 'success', title: 'Draft created', description: 'Opening the new content asset…' });
      navigate(`/content/${res.content.id}`);
    } catch (err) {
      toast({ tone: 'error', title: 'Conversion failed', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const handleConvertToScript = async (id) => {
    setBusyId(id);
    try {
      await api.convertIdeaToScript(id);
      toast({ tone: 'success', title: 'Script generated', description: 'You are being taken to Script Studio.' });
      navigate('/scripts');
    } catch (err) {
      toast({ tone: 'error', title: 'Script generation failed', description: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const visible = view === 'favorites' ? ideas.filter((i) => i.isFavorite) : ideas;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="AI workspace"
        title="Ideas"
        subtitle="Generate, bookmark and convert high-potential concepts into scripts and drafts."
        icon={Lightbulb}
        action={
          <SegmentedControl
            value={view}
            onChange={setView}
            options={[
              { value: 'all', label: `All ${ideas.length ? `(${ideas.length})` : ''}`.trim() },
              { value: 'favorites', label: 'Favourites' },
            ]}
          />
        }
      />

      <Card className="cs-ai-surface p-5">
        <form onSubmit={handleGenerate} className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Field
              label="Topic or niche seed"
              htmlFor="idea-topic"
              hint="Be specific — “local LLMs on a laptop” beats “AI”."
            >
              <Input
                id="idea-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Local LLMs, Solana, AI video editing"
              />
            </Field>
          </div>

          <div className="w-full lg:w-[160px]">
            <Field label="Niche" htmlFor="idea-niche">
              <Select id="idea-niche" value={niche} onChange={(e) => setNiche(e.target.value)}>
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="w-full lg:w-[170px]">
            <Field label="Platform" htmlFor="idea-platform">
              <Select id="idea-platform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0) + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Button
            type="submit"
            variant="ai"
            size="md"
            icon={Sparkles}
            loading={generating}
            disabled={!topic.trim()}
            className="lg:mb-[22px]"
          >
            {generating ? 'Synthesising…' : 'Generate ideas'}
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} rows={2} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Ideas unavailable"
          description={error.message || 'We could not load your idea board.'}
          onRetry={loadIdeas}
        />
      ) : visible.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((idea) => (
            <Card key={idea.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand" size="sm">
                    {idea.platform}
                  </Badge>
                  {idea.category ? (
                    <Badge tone="neutral" size="sm">
                      {idea.category}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <IconButton
                    label={idea.isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                    size="sm"
                    icon={Star}
                    onClick={() => handleFavorite(idea.id)}
                    className={cx(idea.isFavorite && 'text-warning')}
                  />
                  <IconButton
                    label="Delete idea"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(idea.id)}
                    className="hover:text-error"
                  />
                </div>
              </div>

              <h3 className="mt-3 text-lead font-bold leading-snug text-ink">{idea.title}</h3>

              {idea.hook ? (
                <p className="mt-2.5 border-l-2 border-brand pl-3 text-label italic leading-relaxed text-ink-2">
                  “{idea.hook}”
                </p>
              ) : null}

              {idea.reason ? <p className="mt-3 text-caption leading-relaxed text-ink-3">{idea.reason}</p> : null}

              <div className="mt-4 flex-1" />

              <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <Badge tone={(idea.potentialScore || 0) >= 85 ? 'success' : 'info'} size="sm">
                  {`${idea.potentialScore ?? 0}% potential`}
                </Badge>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={FileText}
                    loading={busyId === idea.id}
                    onClick={() => handleConvertToScript(idea.id)}
                  >
                    Script
                  </Button>
                  <Button
                    variant="soft"
                    size="sm"
                    icon={Plus}
                    loading={busyId === idea.id}
                    onClick={() => handleConvertToContent(idea.id)}
                  >
                    Content
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title={view === 'favorites' ? 'No favourites yet' : 'No ideas on the board'}
            description={
              view === 'favorites'
                ? 'Star an idea to keep it in this shortlist.'
                : 'Seed the generator above and CreatorOS will return scored concepts ready to produce.'
            }
          />
        </Card>
      )}
    </div>
  );
}
