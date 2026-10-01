import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileVideo, Scissors, Sparkles, UploadCloud, Video } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, Input } from '../components/ui/Form';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import { Timeline } from '../components/ui/Table';
import { PageLoader } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { VideoClipsTab, VideoRepurposeTab } from './VideoLabTabs';
import { useToast } from '../components/ui/ToastProvider';
import { cx } from '../components/ui/cn';

const TABS = [
  { id: 'CLIPS', label: 'Clips', icon: Scissors },
  { id: 'TRANSCRIPT', label: 'Transcript', icon: FileVideo },
  { id: 'REPURPOSE', label: 'Repurpose', icon: Sparkles },
];

export default function VideoLab() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('CLIPS');
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', filename: '' });
  const [uploading, setUploading] = useState(false);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getVideos();
      setVideos(res.videos || []);
      setSelectedVideo((prev) => prev || res.videos?.[0] || null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleGenerateClip = async () => {
    if (!selectedVideo) return;
    setProcessing(true);
    try {
      const res = await api.generateClip(selectedVideo.id);
      setSelectedVideo((prev) => ({ ...prev, clips: [res.clip, ...(prev.clips || [])] }));
      toast({ tone: 'success', title: 'Clip extracted', description: res.clip?.title });
    } catch (err) {
      toast({ tone: 'error', title: 'Clip extraction failed', description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleRepurpose = async (targetPlatform, targetFormat) => {
    if (!selectedVideo) return;
    setProcessing(true);
    try {
      const res = await api.repurposeVideo(selectedVideo.id, { targetPlatform, targetFormat });
      toast({
        tone: 'success',
        title: `Repurposed for ${targetPlatform}`,
        description: 'A new draft is waiting in your content library.',
      });
      if (res.content?.id) navigate(`/content/${res.content.id}`);
    } catch (err) {
      toast({ tone: 'error', title: 'Repurpose failed', description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const res = await api.uploadVideo({
        title: uploadForm.title || 'New studio recording',
        filename: uploadForm.filename || 'recording.mp4',
      });
      setVideos((prev) => [res.video, ...prev]);
      setSelectedVideo(res.video);
      setUploadForm({ title: '', filename: '' });
      setUploadOpen(false);
      toast({ tone: 'success', title: 'Footage uploaded', description: 'Transcription is ready.' });
    } catch (err) {
      toast({ tone: 'error', title: 'Upload failed', description: err.message });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <PageLoader label="Loading the video lab…" />;
  if (error) {
    return (
      <ErrorState
        title="Video lab unavailable"
        description={error.message || 'We could not load your footage.'}
        onRetry={loadVideos}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Production"
        title="Video lab"
        subtitle="Transcription, viral clip extraction and cross-network repurposing."
        icon={Video}
        action={
          <>
            <Badge tone="neutral">{`${videos.length} recordings`}</Badge>
            <Button variant="ai" size="md" icon={UploadCloud} onClick={() => setUploadOpen(true)}>
              Upload footage
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="h-fit overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-label font-semibold text-ink">Loaded footage</h2>
            <p className="mt-0.5 text-caption text-ink-3">Select a recording to work on.</p>
          </div>

          {videos.length ? (
            <ul className="space-y-1 p-2.5">
              {videos.map((vid) => {
                const active = selectedVideo?.id === vid.id;
                return (
                  <li key={vid.id}>
                    <button
                      type="button"
                      aria-current={active}
                      onClick={() => setSelectedVideo(vid)}
                      className={cx(
                        'w-full rounded-lg border p-3 text-left transition-all',
                        active
                          ? 'border-brand-ring bg-brand-soft'
                          : 'border-transparent hover:border-line hover:bg-surface-2'
                      )}
                    >
                      <p className="truncate text-label font-semibold text-ink">{vid.title}</p>
                      <p className="mt-0.5 text-caption text-ink-3">
                        {`${Math.round(vid.durationSec || 0)}s · ${vid.status || 'READY'} · ${(vid.clips || []).length} clips`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={UploadCloud}
              title="No footage yet"
              description="Upload a recording to unlock transcription, clip extraction and repurposing."
              action={
                <Button variant="primary" size="sm" icon={UploadCloud} onClick={() => setUploadOpen(true)}>
                  Upload footage
                </Button>
              }
            />
          )}
        </Card>

        <div className="space-y-6 xl:col-span-2">
          {selectedVideo ? (
            <Card className="overflow-hidden">
              <div className="aspect-video bg-black">
                <video src={selectedVideo.fileUrl} controls className="h-full w-full object-contain" />
              </div>

              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lead font-semibold text-ink">{selectedVideo.title}</h2>
                  <p className="mt-0.5 text-caption text-ink-3">
                    {`${selectedVideo.filename} · ${Math.round(selectedVideo.durationSec || 0)}s · ${selectedVideo.status}`}
                  </p>
                </div>
                <Badge tone={(selectedVideo.clips || []).length ? 'brand' : 'neutral'} size="sm">
                  {`${(selectedVideo.clips || []).length} clips`}
                </Badge>
              </div>

              <div className="px-5 pb-5 pt-4">
                <Tabs items={TABS} value={activeTab} onChange={setActiveTab} />

                <div className="mt-5">
                  {activeTab === 'CLIPS' ? (
                    <VideoClipsTab
                      video={selectedVideo}
                      processing={processing}
                      onGenerateClip={handleGenerateClip}
                    />
                  ) : null}

                  {activeTab === 'TRANSCRIPT' ? (
                    <div className="space-y-4">
                      <div className="cs-inset max-h-64 overflow-y-auto whitespace-pre-wrap px-4 py-3.5 text-label leading-relaxed text-ink-2">
                        {selectedVideo.transcript?.text || 'No transcript generated for this recording.'}
                      </div>

                      {selectedVideo.transcript?.segments?.length ? (
                        <Timeline
                          items={selectedVideo.transcript.segments.map((seg, idx) => ({
                            id: idx,
                            title: `${seg.speaker || 'Speaker'} · ${Math.round(seg.start)}s–${Math.round(seg.end)}s`,
                            description: seg.text,
                            tone: 'brand',
                          }))}
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === 'REPURPOSE' ? (
                    <VideoRepurposeTab onRepurpose={handleRepurpose} processing={processing} />
                  ) : null}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={Video}
                title="Select or upload footage"
                description="Pick a recording on the left, or upload new footage to start clipping and repurposing."
              />
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload footage"
        subtitle="MP4, MOV or WebM up to 2 GB"
        icon={UploadCloud}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setUploadOpen(false)}>
              Cancel
            </Button>
            <Button variant="ai" size="sm" loading={uploading} onClick={handleUpload}>
              Start processing
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Field label="Title" htmlFor="upload-title">
            <Input
              id="upload-title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Episode 42 — agent architecture deep dive"
            />
          </Field>
          <Field label="Filename" htmlFor="upload-filename" hint="Used as the label for the transcription job.">
            <Input
              id="upload-filename"
              value={uploadForm.filename}
              onChange={(e) => setUploadForm((prev) => ({ ...prev, filename: e.target.value }))}
              placeholder="episode-42.mp4"
            />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
