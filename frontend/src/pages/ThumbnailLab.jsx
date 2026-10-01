import React, { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Sparkles, UploadCloud } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Form';
import { PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { useToast } from '../components/ui/ToastProvider';

export default function ThumbnailLab() {
  const { toast } = useToast();

  const [thumbnails, setThumbnails] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const loadThumbnails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getThumbnails();
      setThumbnails(res.thumbnails || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadThumbnails();
  }, [loadThumbnails]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const res = await api.generateThumbnail({ title, platform: 'YOUTUBE' });
      setThumbnails((prev) => [res.thumbnail, ...prev]);
      setTitle('');
      toast({ tone: 'ai', title: 'Variants rendered', description: 'Cover concepts are queued at the top of the grid.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Render failed', description: err.message });
    } finally {
      setGenerating(false);
    }
  };

  const handleUse = (thumb) => {
    toast({
      tone: 'success',
      title: 'Cover selected',
      description: `${thumb.title} is ready to attach to your next upload.`,
    });
  };

  if (loading) return <PageLoader label="Loading thumbnail variants…" />;
  if (error) {
    return (
      <ErrorState
        title="Thumbnail lab unavailable"
        description={error.message || 'We could not load your cover library.'}
        onRetry={loadThumbnails}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Thumbnail lab"
        subtitle="A/B tested cover concepts with contrast and face calibration."
        icon={ImageIcon}
        action={<Badge tone="neutral">{`${thumbnails.length} variants`}</Badge>}
      />

      <Card className="cs-ai-surface p-5">
        <form onSubmit={handleGenerate} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a concept (e.g. Stop using prompts, Local LLMs)"
            aria-label="Thumbnail concept"
            className="flex-1"
          />
          <Button
            type="submit"
            variant="ai"
            size="md"
            icon={Sparkles}
            loading={generating}
            disabled={!title.trim()}
            className="shrink-0"
          >
            {generating ? 'Rendering…' : 'Generate variants'}
          </Button>
        </form>
        <p className="mt-3 text-caption text-ink-3">
          Each run returns three cover treatments with predicted click-through rates.
        </p>
      </Card>

      {thumbnails.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {thumbnails.map((thumb) => (
            <Card key={thumb.id} hover className="flex flex-col overflow-hidden">
              <div className="relative aspect-video bg-surface-2">
                {thumb.imageUrl ? (
                  <img src={thumb.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-3">
                    <ImageIcon className="h-7 w-7" aria-hidden="true" />
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5">
                  <Badge tone="solid" size="sm">
                    {`Est. CTR ${thumb.clickEstimate ?? 0}%`}
                  </Badge>
                </span>
              </div>

              <div className="flex flex-1 items-center justify-between gap-3 px-4 py-3.5">
                <div className="min-w-0">
                  <h3 className="truncate text-label font-semibold text-ink">{thumb.title}</h3>
                  <p className="mt-0.5 truncate text-caption text-ink-3">{thumb.variantGroup || 'Variant'}</p>
                </div>
                <Button variant="soft" size="sm" onClick={() => handleUse(thumb)}>
                  Use
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={UploadCloud}
            title="No variants yet"
            description="Describe the video concept above and CreatorOS will render cover treatments with predicted click-through rates."
          />
        </Card>
      )}
    </div>
  );
}
