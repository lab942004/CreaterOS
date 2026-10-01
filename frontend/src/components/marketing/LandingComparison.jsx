import React from 'react';
import { Check, Minus, Quote } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { SectionHeading } from './MarketingShared';

const COMPARISON_ROWS = [
  { label: 'Unified cross-platform analytics', creatoros: true, tools: false },
  { label: 'AI Content DNA on every asset', creatoros: true, tools: false },
  { label: 'Automatic short-form clipping', creatoros: true, tools: 'partial' },
  { label: 'Strategy grounded in your own data', creatoros: true, tools: false },
  { label: 'Algorithm-optimal scheduling', creatoros: true, tools: 'partial' },
  { label: 'Brand deal CRM and invoicing', creatoros: true, tools: false },
  { label: 'One login, one workspace', creatoros: true, tools: false },
];

function ComparisonCell({ value }) {
  if (value === true) {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-pill bg-success/15 text-success">
        <Check className="h-3 w-3" aria-hidden="true" />
      </span>
    );
  }
  if (value === 'partial') return <span className="text-caption font-semibold text-warning">Partial</span>;
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-pill bg-surface-3 text-ink-3">
      <Minus className="h-3 w-3" aria-hidden="true" />
    </span>
  );
}

/** ComparisonTable — CreatorOS versus the scattered tool stack. */
export function ComparisonTable() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-[26px] font-bold tracking-tight text-ink sm:text-[30px]">
          Stop paying for eight tools that never talk to each other
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-lead text-ink-2">
          The average creator runs 7–12 subscriptions. CreatorOS collapses them into one workspace with a shared memory.
        </p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th className="px-5 py-4 text-left text-caption font-bold uppercase tracking-wider text-ink-3">
                  Capability
                </th>
                <th className="px-5 py-4 text-center text-caption font-bold uppercase tracking-wider text-brand">
                  CreatorOS
                </th>
                <th className="px-5 py-4 text-center text-caption font-bold uppercase tracking-wider text-ink-3">
                  Scattered stack
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5 text-label text-ink-2">{row.label}</td>
                  <td className="px-5 py-3.5 text-center">
                    <ComparisonCell value={row.creatoros} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <ComparisonCell value={row.tools} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote:
      'I stopped guessing which video to make next. Content DNA showed the exact hook pattern behind my three best months.',
    name: 'Maya Okonkwo',
    role: 'Tech educator • 480K subscribers',
  },
  {
    quote:
      'The Video Lab alone replaced my clipping contractor. One upload becomes eleven posts before I finish my coffee.',
    name: 'Daniel Reyes',
    role: 'Solo founder • Multi-platform',
  },
  {
    quote:
      'Finally one dashboard for analytics, sponsors and the publishing calendar. My team stopped living in spreadsheets.',
    name: 'Priya Raman',
    role: 'Media studio lead • 4 editors',
  },
];

/** Testimonials — social proof from creators and small studios. */
export function Testimonials() {
  return (
    <section className="border-t border-line py-20">
      <div className="mx-auto max-w-6xl px-6">
        <SectionHeading
          eyebrow="Creator stories"
          title="Built for people who publish every week"
          description="From solo founders to small studios, CreatorOS is judged on one thing: does the next post perform better than the last?"
        />

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <figure key={item.name} className="cs-card flex flex-col justify-between p-6">
              <Quote className="h-6 w-6 text-brand" aria-hidden="true" />
              <blockquote className="mt-4 text-label leading-relaxed text-ink-2">“{item.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <Avatar name={item.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-label font-semibold text-ink">{item.name}</p>
                  <p className="truncate text-caption text-ink-3">{item.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
