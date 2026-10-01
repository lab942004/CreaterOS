import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, Plus, Sparkles, Trash2, Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, SectionCard } from '../components/ui/Card';
import { Button, IconButton } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Field, Input, TextArea, Select, SearchInput } from '../components/ui/Form';
import { Modal, ConfirmDialog } from '../components/ui/Modal';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';
import { Toolbar } from '../components/ui/Table';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/ToastProvider';

const CATEGORIES = ['BRAND', 'STYLE', 'AUDIENCE', 'WORKFLOW', 'GENERAL'];

const CATEGORY_TONES = {
  BRAND: 'brand',
  STYLE: 'cyan',
  AUDIENCE: 'info',
  WORKFLOW: 'warning',
  GENERAL: 'neutral',
};

export default function CreatorMemory() {
  const { toast } = useToast();
  const [memories, setMemories] = useState([]);
  const [draft, setDraft] = useState({ key: '', value: '', category: 'BRAND' });
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMemories();
      setMemories(res.memories || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!draft.key.trim() || !draft.value.trim()) {
      toast({ title: 'Key and value are required', tone: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const res = await api.createMemory({
        key: draft.key.trim(),
        value: draft.value.trim(),
        category: draft.category,
      });
      setMemories((prev) => [...prev, res.memory]);
      setDraft({ key: '', value: '', category: draft.category });
      setModalOpen(false);
      toast({ title: 'Memory stored', description: `${res.memory?.key} is now available to every AI surface.`, tone: 'ai' });
    } catch (err) {
      toast({ title: 'Could not store memory', description: err.message, tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteMemory(pendingDelete.id);
      setMemories((prev) => prev.filter((memory) => memory.id !== pendingDelete.id));
      toast({ title: 'Memory removed', description: pendingDelete.key, tone: 'success' });
      setPendingDelete(null);
    } catch (err) {
      toast({ title: 'Could not remove memory', description: err.message, tone: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: 'ALL', label: 'All', count: memories.length },
      ...CATEGORIES.map((item) => ({
        id: item,
        label: item.charAt(0) + item.slice(1).toLowerCase(),
        count: memories.filter((memory) => memory.category === item).length,
      })),
    ],
    [memories]
  );

  const visible = memories.filter((memory) => {
    const matchesCategory = category === 'ALL' || memory.category === category;
    if (!matchesCategory) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      String(memory.key || '').toLowerCase().includes(query) ||
      String(memory.value || '').toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Creator Intelligence"
          title="Creator memory"
          subtitle="Fine-grained facts, style preferences and guardrails retained across sessions."
          icon={Database}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Memory unavailable"
        description={error.message || 'We could not load the creator memory for this workspace.'}
        onRetry={loadMemories}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Creator Intelligence"
        title="Creator memory"
        subtitle="Fine-grained facts, style preferences and guardrails retained across sessions."
        icon={Database}
        action={
          <>
            <Badge tone="brand" size="sm">
              {memories.length} {memories.length === 1 ? 'entry' : 'entries'}
            </Badge>
            <Button icon={Plus} onClick={() => setModalOpen(true)}>
              New memory
            </Button>
          </>
        }
      />

      <Tabs items={tabs} value={category} onChange={setCategory} />

      <Toolbar action={<span className="text-caption text-ink-3">{visible.length} shown</span>}>
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search facts, hooks or banned words…"
          wrapperClassName="w-full sm:w-80"
          aria-label="Search creator memory"
        />
      </Toolbar>

      {visible.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((memory) => (
            <Card key={memory.id} hover className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge tone={CATEGORY_TONES[memory.category] || 'neutral'} size="sm">
                  {memory.category || 'GENERAL'}
                </Badge>
                <IconButton
                  label={`Delete ${memory.key}`}
                  size="sm"
                  icon={Trash2}
                  onClick={() => setPendingDelete(memory)}
                />
              </div>

              <h3 className="mt-3 text-label font-semibold text-ink">{memory.key}</h3>
              <p className="mt-1 text-caption leading-relaxed text-ink-2">{memory.value}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-0">
          <EmptyState
            icon={Lightbulb}
            title={search ? 'No memories match that search' : 'No memories captured yet'}
            description={
              search
                ? 'Try a different keyword or clear the search field.'
                : 'Store the facts the AI should never forget — hooks that work, words to avoid, audience truths.'
            }
            action={
              search ? (
                <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              ) : (
                <Button size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
                  Add first memory
                </Button>
              )
            }
          />
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New memory"
        subtitle="Facts stored here are injected into every AI generation."
        icon={Sparkles}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="memory-form" size="sm" icon={Plus} loading={saving}>
              Save memory
            </Button>
          </>
        }
      >
        <form id="memory-form" onSubmit={handleCreate} className="space-y-4">
          <Field label="Fact key" htmlFor="memory-key" hint="Short handle, e.g. “Thumbnail Style”.">
            <Input
              id="memory-key"
              value={draft.key}
              placeholder="Thumbnail Style"
              onChange={(event) => setDraft({ ...draft, key: event.target.value })}
            />
          </Field>

          <Field label="Value" htmlFor="memory-value">
            <TextArea
              id="memory-value"
              rows={3}
              value={draft.value}
              placeholder="High contrast dark background with bold cyan rim light."
              onChange={(event) => setDraft({ ...draft, value: event.target.value })}
            />
          </Field>

          <Field label="Category" htmlFor="memory-category">
            <Select
              id="memory-category"
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete this memory?"
        description={`“${pendingDelete?.key || ''}” will be removed from the creator memory. This cannot be undone.`}
        confirmLabel="Delete memory"
      />

      <SectionCard title="How memory is used" subtitle="No configuration required" icon={Sparkles}>
        <p className="text-caption leading-relaxed text-ink-2">
          Every generation request carries this memory set as context, so drafts inherit your hooks, banned
          phrases and audience truths automatically. Add a memory the moment the AI gets something subtly
          wrong — it will not repeat the mistake.
        </p>
      </SectionCard>
    </div>
  );
}
