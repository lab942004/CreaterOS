import React from 'react';
import { cx } from './cn';
import { EmptyState } from './States';

/**
 * DataTable — the single tabular primitive.
 * `columns`: [{ key, header, align, width, render?(row), className }]
 */
export function DataTable({ columns = [], rows = [], rowKey = (row, i) => row.id || i, onRowClick, empty, className = '' }) {
  if (!rows.length) {
    return (
      <div className={cx('cs-card', className)}>
        {empty || <EmptyState title="Nothing here yet" description="Data will appear as soon as it is available." />}
      </div>
    );
  }

  return (
    <div className={cx('cs-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="cs-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cx(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cx(
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.cellClassName
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Toolbar — search + filters + actions row that sits above tables and grids. */
export function Toolbar({ children, action, className = '' }) {
  return (
    <div className={cx('cs-card flex flex-wrap items-center gap-3 p-3', className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">{children}</div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/** KeyValueList — definition list for meta panels (settings, detail sidebars). */
export function KeyValueList({ items = [], className = '' }) {
  return (
    <dl className={cx('divide-y divide-line', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 py-2.5">
          <dt className="text-caption text-ink-3">{item.label}</dt>
          <dd className="text-label font-semibold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Timeline — vertical activity feed (autopilot runs, audit trails). */
export function Timeline({ items = [], className = '' }) {
  return (
    <ol className={cx('relative space-y-4 pl-5', className)}>
      <span className="absolute left-[5px] top-1.5 bottom-1.5 w-px bg-line-2" aria-hidden="true" />
      {items.map((item, i) => (
        <li key={item.id || i} className="relative">
          <span
            className={cx(
              'absolute -left-5 top-1 h-2.5 w-2.5 rounded-pill border-2',
              item.tone === 'success'
                ? 'bg-success'
                : item.tone === 'error'
                  ? 'bg-error'
                  : item.tone === 'warning'
                    ? 'bg-warning'
                    : 'bg-brand'
            )}
            style={{ borderColor: 'var(--cs-surface)' }}
            aria-hidden="true"
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-label font-semibold text-ink">{item.title}</p>
            {item.time ? <span className="text-caption text-ink-3">{item.time}</span> : null}
          </div>
          {item.description ? <p className="mt-0.5 text-caption text-ink-2">{item.description}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export default DataTable;
