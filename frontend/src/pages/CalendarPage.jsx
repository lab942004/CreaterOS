import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Button, IconButton } from '../components/ui/Button';
import { PageLoader } from '../components/ui/Feedback';
import { ErrorState } from '../components/ui/States';
import { PlatformMark, PLATFORM_META } from '../components/ui/Platform';
import { cx } from '../components/ui/cn';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const monthLabel = (date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(() => new Date());

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCalendarEvents();
      setEvents(res.events || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  /** Events bucketed by local calendar day. */
  const byDay = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const when = new Date(ev.start);
      if (Number.isNaN(when.getTime())) return;
      const key = startOfDay(when);
      const bucket = map.get(key) || [];
      bucket.push(ev);
      map.set(key, bucket);
    });
    return map;
  }, [events]);

  /** Six-week grid anchored on the first weekday of the visible month. */
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return {
        date,
        inMonth: date.getMonth() === cursor.getMonth(),
        isToday: startOfDay(date) === startOfDay(new Date()),
        events: byDay.get(startOfDay(date)) || [],
      };
    });
  }, [cursor, byDay]);

  const monthEvents = cells.reduce((sum, cell) => (cell.inMonth ? sum + cell.events.length : sum), 0);

  const shiftMonth = (delta) => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  const upcoming = useMemo(
    () =>
      [...events]
        .filter((ev) => new Date(ev.start).getTime() >= Date.now() - 86400000)
        .sort((a, b) => new Date(a.start) - new Date(b.start))
        .slice(0, 5),
    [events]
  );

  if (loading) return <PageLoader label="Loading publishing calendar…" />;
  if (error) {
    return (
      <ErrorState
        title="Calendar unavailable"
        description={error.message || 'We could not load your publishing calendar.'}
        onRetry={loadEvents}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheduling"
        title="Publishing calendar"
        subtitle="Plan and coordinate multi-platform release cadences."
        icon={CalendarDays}
        action={
          <Button to="/composer" variant="ai" size="md" icon={Plus}>
            Schedule post
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <IconButton label="Previous month" size="sm" icon={ChevronLeft} onClick={() => shiftMonth(-1)} />
            <span className="min-w-[150px] text-center text-label font-semibold text-ink">{monthLabel(cursor)}</span>
            <IconButton label="Next month" size="sm" icon={ChevronRight} onClick={() => shiftMonth(1)} />
            <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="brand">{`${monthEvents} events this month`}</Badge>
            {Object.keys(PLATFORM_META)
              .slice(0, 4)
              .map((platform) => (
                <span key={platform} className="inline-flex items-center gap-1.5 text-caption text-ink-3">
                  <PlatformMark platform={platform} size={16} />
                  {PLATFORM_META[platform].label}
                </span>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-line">
          {WEEKDAYS.map((day) => (
            <div key={day} className="px-3 py-2 text-center text-caption font-semibold uppercase tracking-wider text-ink-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => (
            <div
              key={idx}
              className={cx(
                'min-h-[104px] border-b border-r border-line p-2',
                idx % 7 === 6 && 'border-r-0',
                !cell.inMonth && 'bg-app-2',
                cell.isToday && 'bg-brand-soft'
              )}
            >
              <span
                className={cx(
                  'text-caption font-semibold',
                  cell.inMonth ? 'text-ink-2' : 'text-ink-3',
                  cell.isToday && 'text-brand'
                )}
              >
                {cell.date.getDate()}
              </span>

              <div className="mt-1.5 space-y-1">
                {cell.events.slice(0, 2).map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => navigate(`/content/${ev.id}`)}
                    className="flex w-full items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-1.5 py-1 text-left transition-colors hover:border-brand-ring"
                  >
                    <PlatformMark platform={ev.platform} size={14} />
                    <span className="truncate text-caption font-medium text-ink-2">{ev.title}</span>
                  </button>
                ))}
                {cell.events.length > 2 ? (
                  <span className="block px-1 text-caption text-ink-3">{`+${cell.events.length - 2} more`}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-label font-semibold text-ink">Next in the queue</h2>
          <p className="mt-0.5 text-caption text-ink-3">The five closest dated assets across every channel.</p>
        </div>

        {upcoming.length ? (
          <ul className="divide-y divide-line">
            {upcoming.map((ev) => (
              <li key={ev.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <PlatformMark platform={ev.platform} size={30} />
                  <div className="min-w-0">
                    <p className="truncate text-label font-semibold text-ink">{ev.title}</p>
                    <p className="text-caption text-ink-3">{new Date(ev.start).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge status={ev.status} size="sm" />
                  <Button to={`/content/${ev.id}`} variant="ghost" size="sm">
                    Open
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-10 text-center text-caption text-ink-3">
            Nothing scheduled yet — create a post in the Composer to see it here.
          </p>
        )}
      </Card>
    </div>
  );
}
