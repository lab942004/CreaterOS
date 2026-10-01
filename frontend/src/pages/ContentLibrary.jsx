import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Eye, FileText, Layers, Plus } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Select, SearchInput } from '../components/ui/Form';
import { Toolbar } from '../components/ui/Table';
import { Tag, PlatformBadge } from '../components/ui/Platform';
import { SkeletonCard } from '../components/ui/Feedback';
import { EmptyState, ErrorState } from '../components/ui/States';

const PLATFORMS = ['ALL', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'LINKEDIN'];
const TYPES = ['ALL', 'VIDEO', 'SHORT', 'CAROUSEL', 'ARTICLE'];
const STATUSES = ['ALL', 'PUBLISHED', 'SCHEDULED', 'DRAFT'];

export default function ContentLibrary() {
  const [contents, setContents] = useState([]);
  const [platform, setPlatform] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContent({ platform, type, status, search });
      setContents(res.contents || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [platform, type, status, search]);

  /* Debounced so typing in the search field does not fire a request per key. */
  useEffect(() => {
    const timer = setTimeout(loadContent, 250);
    return () => clearTimeout(timer);
  }, [loadContent]);

  const resetFilters = () => {
    setPlatform('ALL');
    setType('ALL');
    setStatus('ALL');
    setSearch('');
  };

  const filtersActive = platform !== 'ALL' || type !== 'ALL' || status !== 'ALL' || search !== '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Content library"
        subtitle="Every cross-network asset, draft and DNA report in one place."
        icon={Layers}
        action={
          <Button to="/composer" variant="ai" size="md" icon={Plus}>
            New content
          </Button>
        }
      />

      <Toolbar
        action={
          filtersActive ? (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          ) : null
        }
      >
        <SearchInput
          wrapperClassName="min-w-[200px] flex-1"
          placeholder="Search titles, tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search content"
        />

        <div className="w-[168px]">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Filter by platform">
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All platforms' : p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-[150px]">
          <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by format">
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All formats' : t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-[150px]">
          <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All statuses' : s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </Select>
        </div>
      </Toolbar>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} rows={2} />
          ))}
        </div>
      ) : error ? (
        <ErrorState
          title="Content library unavailable"
          description={error.message || 'We could not load your assets.'}
          onRetry={loadContent}
        />
      ) : contents.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {contents.map((item) => (
            <Card key={item.id} hover className="flex flex-col overflow-hidden">
              <div className="relative aspect-video overflow-hidden border-b border-line bg-surface-2">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-ink-3">
                    <FileText className="h-7 w-7" aria-hidden="true" />
                  </span>
                )}
                <span className="absolute left-2.5 top-2.5">
                  <PlatformBadge platform={item.platform} size="sm" className="bg-app-2/80 backdrop-blur" />
                </span>
                {item.type ? (
                  <span className="absolute right-2.5 top-2.5">
                    <Badge tone="solid" size="sm">
                      {item.type}
                    </Badge>
                  </span>
                ) : null}
              </div>

              <div className="flex-1 px-4 py-4">
                <h3 className="line-clamp-2 text-label font-semibold text-ink">{item.title}</h3>
                {item.caption || item.description ? (
                  <p className="mt-1 line-clamp-2 text-caption text-ink-3">{item.caption || item.description}</p>
                ) : null}

                {item.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <Tag key={idx}>#{tag}</Tag>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
                <span className="flex items-center gap-2">
                  <StatusBadge status={item.status} size="sm" />
                  {item.status === 'PUBLISHED' && typeof item.views === 'number' ? (
                    <span className="inline-flex items-center gap-1 text-caption tabular-nums text-ink-3">
                      <Eye className="h-3 w-3" aria-hidden="true" />
                      {item.views.toLocaleString()}
                    </span>
                  ) : null}
                </span>
                <NavLink
                  to={`/content/${item.id}`}
                  className="inline-flex items-center gap-1 text-caption font-semibold text-brand transition-opacity hover:opacity-80"
                >
                  Details
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </NavLink>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Layers}
            title={filtersActive ? 'No content matches these filters' : 'Your library is empty'}
            description={
              filtersActive
                ? 'Try a different platform, format or status — or clear the filters to see everything.'
                : 'Create your first asset in the Composer and it will appear here with full DNA analytics.'
            }
            action={
              filtersActive ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button to="/composer" variant="primary" size="sm" icon={Plus}>
                  Create content
                </Button>
              )
            }
          />
        </Card>
      )}
    </div>
  );
}
