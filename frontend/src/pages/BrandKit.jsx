import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Image, Link2, Palette, Plus, Save, Sparkles, Trash2, Type } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, Input, TextArea } from '../components/ui/Form';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { Avatar } from '../components/ui/Avatar';
import { PlatformMark, platformLabel } from '../components/ui/Platform';
import { useToast } from '../components/ui/ToastProvider';

/** Platforms that can carry a public handle in the brand kit. */
const HANDLE_PLATFORMS = ['youtube', 'instagram', 'tiktok', 'linkedin', 'twitter', 'facebook'];

export default function BrandKit() {
  const { toast } = useToast();
  const [kit, setKit] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kitRes, previewRes] = await Promise.all([
        api.getBrandKit(),
        api.getBrandPreview().catch(() => null),
      ]);
      setKit(kitRes.brandKit || { colors: [], fonts: [], handles: {} });
      setPreview(previewRes);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const colors = kit?.colors || [];
  const fonts = kit?.fonts || [];
  const handles = kit?.handles || {};

  const patch = (changes) => setKit((prev) => ({ ...prev, ...changes }));
  const setColor = (index, value) =>
    patch({ colors: colors.map((color, i) => (i === index ? value : color)) });
  const addColor = () => patch({ colors: [...colors, '#6C4DFF'] });
  const removeColor = (index) => patch({ colors: colors.filter((_, i) => i !== index) });
  const setFont = (index, value) => patch({ fonts: fonts.map((font, i) => (i === index ? value : font)) });
  const addFont = () => patch({ fonts: [...fonts, 'Inter'] });
  const removeFont = (index) => patch({ fonts: fonts.filter((_, i) => i !== index) });
  const setHandle = (key, value) => patch({ handles: { ...handles, [key]: value } });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!kit) return;
    setSaving(true);
    try {
      const payload = { ...kit, colors: colors.filter(Boolean), fonts: fonts.filter(Boolean) };
      const res = await api.updateBrandKit(payload);
      setKit(res.brandKit || payload);
      const refreshed = await api.getBrandPreview().catch(() => null);
      if (refreshed) setPreview(refreshed);
      toast({
        title: 'Brand kit updated',
        description: 'New presets now apply to thumbnails, captions and exports.',
        tone: 'success',
      });
    } catch (err) {
      toast({ title: 'Could not save the brand kit', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader label="Loading brand kit…" />;
  if (error) {
    return (
      <ErrorState
        title="Brand kit unavailable"
        description={error.message || 'We could not load the brand kit for this workspace.'}
        onRetry={load}
      />
    );
  }

  const previewPost = preview?.mockPostPreview;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Brand"
        title="Brand kit"
        subtitle="Logos, colour palettes, typography and visual presets applied across every generated asset."
        icon={Palette}
        action={
          <>
            <Badge tone="neutral" size="sm">
              {colors.length} colours · {fonts.length} fonts
            </Badge>
            <Button type="submit" form="brand-kit-form" icon={Save} loading={saving}>
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <form id="brand-kit-form" onSubmit={handleSubmit} className="space-y-6 xl:col-span-2">
          <SectionCard title="Identity" subtitle="Logo source and the voice every caption inherits" icon={Image}>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2">
                  {kit?.logoUrl ? (
                    <img src={kit.logoUrl} alt="Brand logo" className="h-full w-full object-cover" />
                  ) : (
                    <Image className="h-6 w-6 text-ink-3" aria-hidden="true" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <Field label="Logo URL" htmlFor="kit-logo" hint="Square artwork, at least 512×512.">
                    <Input
                      id="kit-logo"
                      value={kit?.logoUrl || ''}
                      placeholder="https://cdn.creatoros.app/logo.png"
                      onChange={(event) => patch({ logoUrl: event.target.value })}
                    />
                  </Field>
                </div>
              </div>

              <Field label="Tone & voice" htmlFor="kit-voice" hint="Read by the AI before writing any copy.">
                <TextArea
                  id="kit-voice"
                  rows={3}
                  value={kit?.brandVoice || ''}
                  placeholder="Authoritative, builder-focused, pragmatic."
                  onChange={(event) => patch({ brandVoice: event.target.value })}
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            title="Colour palette"
            subtitle="Used for thumbnails, charts and exported assets"
            icon={Palette}
            action={
              <Button variant="secondary" size="sm" icon={Plus} onClick={addColor}>
                Add colour
              </Button>
            }
          >
            <div className="space-y-3">
              {colors.length ? (
                colors.map((color, index) => (
                  <div key={`${color}-${index}`} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#6C4DFF'}
                      onChange={(event) => setColor(index, event.target.value.toUpperCase())}
                      aria-label={`Colour ${index + 1}`}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface-2 p-1"
                    />
                    <Input
                      value={color}
                      onChange={(event) => setColor(index, event.target.value)}
                      className="font-mono uppercase"
                      aria-label={`Colour ${index + 1} hex value`}
                    />
                    <IconButton
                      label={`Remove colour ${index + 1}`}
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeColor(index)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-caption text-ink-3">No colours defined yet — add the primary swatch first.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Typography"
            subtitle="Font stack used in captions, thumbnails and reports"
            icon={Type}
            action={
              <Button variant="secondary" size="sm" icon={Plus} onClick={addFont}>
                Add font
              </Button>
            }
          >
            <div className="space-y-3">
              {fonts.length ? (
                fonts.map((font, index) => (
                  <div key={`${font}-${index}`} className="flex items-center gap-3">
                    <span className="flex h-10 w-12 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-2 text-label font-semibold text-ink-2">
                      Aa
                    </span>
                    <Input
                      value={font}
                      onChange={(event) => setFont(index, event.target.value)}
                      aria-label={`Font ${index + 1}`}
                    />
                    <IconButton
                      label={`Remove font ${index + 1}`}
                      size="sm"
                      icon={Trash2}
                      onClick={() => removeFont(index)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-caption text-ink-3">No fonts defined yet — add the primary typeface.</p>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Public handles" subtitle="Shown on previews and exported assets" icon={Link2}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {HANDLE_PLATFORMS.map((platform) => (
                <Field key={platform} label={platformLabel(platform.toUpperCase())} htmlFor={`handle-${platform}`}>
                  <div className="flex items-center gap-2">
                    <PlatformMark platform={platform.toUpperCase()} />
                    <Input
                      id={`handle-${platform}`}
                      value={handles[platform] || ''}
                      placeholder="@handle"
                      onChange={(event) => setHandle(platform, event.target.value)}
                    />
                  </div>
                </Field>
              ))}
            </div>
          </SectionCard>
        </form>

        <div className="space-y-6">
          <SectionCard title="Live preview" subtitle="How the kit renders inside a post" icon={Eye}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar src={previewPost?.avatar} name={previewPost?.creatorName || 'Creator'} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-label font-semibold text-ink">
                    {previewPost?.creatorName || 'Creator'}
                  </p>
                  <p className="truncate text-caption text-ink-3">
                    {previewPost?.handle || handles.youtube || '@handle'}
                  </p>
                </div>
              </div>

              <p className="cs-inset px-4 py-3.5 text-caption leading-relaxed text-ink-2">
                {previewPost?.samplePost ||
                  kit?.brandVoice ||
                  'Add a tone of voice above to preview how generated posts will read.'}
              </p>

              <div>
                <p className="cs-eyebrow">Palette applied</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(previewPost?.colors?.length ? previewPost.colors : colors).map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="h-9 w-9 rounded-lg border border-line"
                      style={{ backgroundColor: color }}
                      role="img"
                      aria-label={`Brand colour ${color}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="cs-eyebrow">Typography</p>
                <div className="mt-2 space-y-1.5">
                  {fonts.length ? (
                    fonts.map((font, index) => (
                      <p
                        key={`${font}-${index}`}
                        className="text-label font-semibold text-ink"
                        style={{ fontFamily: `${font}, system-ui, sans-serif` }}
                      >
                        {font}
                      </p>
                    ))
                  ) : (
                    <p className="text-caption text-ink-3">No fonts defined.</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          <Card className="cs-ai-surface p-5">
            <p className="flex items-center gap-1.5 text-caption font-semibold text-brand">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Brand consistency
            </p>
            <p className="mt-1.5 text-caption leading-relaxed text-ink-2">
              Thumbnail Lab, Video Lab and the caption writer all read this kit before rendering, so new assets
              arrive on-brand without a manual review pass.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
