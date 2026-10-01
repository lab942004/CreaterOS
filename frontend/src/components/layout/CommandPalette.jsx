import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search, Sparkles, Terminal } from 'lucide-react';
import { cx } from '../ui/cn';
import { PlatformBadge } from '../ui/Platform';
import { Modal, useEscape, useLockBody } from '../ui/Modal';
import { api } from '../../services/api';
import { flatNavItems } from './navUtils';

/**
 * CommandPalette — the ⌘K surface.
 * One entry point for navigation, cross-entity search (content, ideas, videos)
 * and conversational AI dispatch.
 */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);

  useLockBody(open);
  useEscape(open, onClose);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced cross-entity search against the existing global search endpoint.
  useEffect(() => {
    if (!open) return undefined;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await api.search(trimmed);
        if (!cancelled) setResults(res);
      } catch {
        if (!cancelled) setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, open]);

  const commands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flatNavItems.slice(0, 7);
    return flatNavItems.filter((item) => item.name.toLowerCase().includes(q) || item.path.includes(q)).slice(0, 6);
  }, [query]);

  const contentHits = results?.content || [];
  const ideaHits = results?.ideas || [];
  const videoHits = results?.videos || [];

  const total =
    commands.length + contentHits.length + ideaHits.length + videoHits.length;

  const go = useCallback(
    (path) => {
      onClose?.();
      navigate(path);
    },
    [navigate, onClose]
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, Math.max(total - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const flat = [
        ...commands.map((c) => c.path),
        ...contentHits.map((c) => `/content/${c.id}`),
        ...ideaHits.map(() => '/ideas'),
        ...videoHits.map(() => '/video-lab'),
      ];
      if (flat[cursor]) go(flat[cursor]);
      else if (query.trim()) go('/ai/strategist');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} size="lg" className="!p-0">
      <div className="-m-5">
        <div className="flex items-center gap-3 border-b border-line px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search content, ideas, videos — or ask the AI Strategist…"
            className="flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
            aria-label="Global search"
          />
          {loading ? <span className="text-caption text-ink-3">Searching…</span> : null}
          <kbd className="rounded-sm border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-3">
            ESC
          </kbd>
        </div>

        <div className="max-h-[54vh] overflow-y-auto p-3">
          {commands.length ? (
            <div className="mb-3">
              <p className="cs-eyebrow px-2 pb-1.5">Navigate</p>
              {commands.map((cmd, i) => (
                <button
                  key={cmd.path}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(cmd.path)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    cursor === i ? 'bg-brand-soft' : 'hover:bg-surface-2'
                  )}
                >
                  <cmd.icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-label font-medium text-ink">{cmd.name}</span>
                  <span className="shrink-0 text-caption text-ink-3">{cmd.group}</span>
                </button>
              ))}
            </div>
          ) : null}

          {contentHits.length ? (
            <div className="mb-3">
              <p className="cs-eyebrow px-2 pb-1.5">Content</p>
              {contentHits.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(`/content/${item.id}`)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <PlatformBadge platform={item.platform} size="sm" showLabel={false} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label font-medium text-ink">{item.title}</span>
                    <span className="block text-caption text-ink-3">
                      {item.type} • {item.status}
                    </span>
                  </span>
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}

          {ideaHits.length ? (
            <div className="mb-3">
              <p className="cs-eyebrow px-2 pb-1.5">Ideas</p>
              {ideaHits.slice(0, 3).map((idea) => (
                <button
                  key={idea.id}
                  type="button"
                  onClick={() => go('/ideas')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-label font-medium text-ink">{idea.title}</span>
                    <span className="block text-caption text-ink-3">
                      {idea.platform} • {idea.category} • {idea.potentialScore}% potential
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          {videoHits.length ? (
            <div className="mb-3">
              <p className="cs-eyebrow px-2 pb-1.5">Footage</p>
              {videoHits.slice(0, 2).map((vid) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => go('/video-lab')}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <Terminal className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-label font-medium text-ink">{vid.title}</span>
                  <span className="shrink-0 text-caption text-ink-3">{Math.round(vid.durationSec)}s</span>
                </button>
              ))}
            </div>
          ) : null}

          {query.trim() ? (
            <button
              type="button"
              onClick={() => go('/ai/strategist')}
              className="mb-1 flex w-full items-center gap-3 rounded-xl border border-brand-ring bg-brand-soft px-3 py-2.5 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg cs-gradient-brand text-white">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label font-semibold text-ink">
                  Ask the AI Strategist: “{query.trim()}”
                </span>
                <span className="block text-caption text-ink-2">
                  Plans grounded in your Creator Brain, analytics and published content
                </span>
              </span>
            </button>
          ) : null}

          {!commands.length && !contentHits.length && !ideaHits.length && !videoHits.length && query.trim() && !loading ? (
            <p className="px-2 py-6 text-center text-caption text-ink-3">
              No matches in your workspace. Try the AI Strategist above.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

