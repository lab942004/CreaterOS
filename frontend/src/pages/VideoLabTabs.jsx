import React from 'react';
import { Scissors, Sparkles } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Tag } from '../components/ui/Platform';
import { EmptyState } from '../components/ui/States';
import { cx } from '../components/ui/cn';

/** Clip generator — spike-detected highlights with viral scores. */
export function VideoClipsTab({ video, processing, onGenerateClip }) {
  const clips = video.clips || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-label font-semibold text-ink">Viral clip candidates</h3>
          <p className="mt-0.5 text-caption text-ink-3">Scored on hook strength, pacing and platform fit.</p>
        </div>
        <Button variant="ai" size="md" icon={Scissors} loading={processing} onClick={onGenerateClip}>
          Extract new clip
        </Button>
      </div>

      {clips.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {clips.map((clip) => (
            <div key={clip.id} className="cs-inset flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <Badge tone={(clip.score || 0) >= 90 ? 'success' : 'info'} size="sm">
                  {`Viral score ${clip.score ?? 0}%`}
                </Badge>
                <span className="text-caption tabular-nums text-ink-3">
                  {`${Math.round(clip.durationSec || 0)}s`}
                </span>
              </div>

              <h4 className="mt-2.5 text-label font-semibold leading-snug text-ink">{clip.title}</h4>
              {clip.hook ? <p className="mt-1.5 text-caption italic leading-relaxed text-ink-3">“{clip.hook}”</p> : null}

              <div className="mt-3 flex flex-1 items-end justify-between gap-2">
                <Tag>{`${Math.round(clip.startSec || 0)}s – ${Math.round(clip.endSec || 0)}s`}</Tag>
                {clip.clipUrl ? (
                  <a
                    href={clip.clipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-caption font-semibold text-brand transition-opacity hover:opacity-80"
                  >
                    Preview clip
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Scissors}
          title="No clips extracted yet"
          description="Run the spike detector and CreatorOS will cut the highest-retention moments into vertical clips."
        />
      )}
    </div>
  );
}

const REPURPOSE_TARGETS = [
  { platform: 'TIKTOK', format: 'SHORT', title: 'Video → TikTok', description: 'Vertical highlights with burned-in captions.' },
  { platform: 'LINKEDIN', format: 'ARTICLE', title: 'Video → LinkedIn', description: 'Executive article distilled from the transcript.' },
  { platform: 'INSTAGRAM', format: 'CAROUSEL', title: 'Video → Carousel', description: 'Slide deck built from the key frames.' },
];

/** Repurpose tab — turns one recording into native assets for other networks. */
export function VideoRepurposeTab({ onRepurpose, processing = false }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
        <p className="text-caption leading-relaxed text-ink-2">
          Repurposing drafts a brand-new asset for the target network and stores it as a draft in your library.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {REPURPOSE_TARGETS.map((target) => (
          <button
            key={target.platform}
            type="button"
            disabled={processing}
            onClick={() => onRepurpose(target.platform, target.format)}
            className={cx(
              'rounded-xl border border-line bg-surface-2 p-4 text-left transition-all',
              processing ? 'cursor-not-allowed opacity-60' : 'hover:border-brand-ring hover:bg-surface-3'
            )}
          >
            <span className="block text-label font-semibold text-ink">{target.title}</span>
            <span className="mt-1 block text-caption leading-relaxed text-ink-3">{target.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
