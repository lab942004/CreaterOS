import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, PanelLeftClose } from 'lucide-react';
import { cx } from '../ui/cn';
import { Logo, LogoMark } from '../ui/Logo';
import { IconButton } from '../ui/Button';
import { navGroups } from './navigationConfig';
import { findActiveItem, matchesPath } from './navUtils';

/**
 * Sidebar — primary navigation rail.
 * Collapses to an icon rail (264px -> 76px) and expands page groups in place,
 * so every route stays one interaction away without a sprawling menu.
 */
export default function Sidebar({ collapsed, onToggleCollapsed, children, user, usage }) {
  const location = useLocation();
  const { item: activeItem } = findActiveItem(location.pathname);
  const [expanded, setExpanded] = useState(() => new Set(['/dashboard']));

  // Keep the branch containing the current route open.
  useEffect(() => {
    if (!activeItem) return;
    setExpanded((prev) => {
      if (prev.has(activeItem.path)) return prev;
      const next = new Set(prev);
      next.add(activeItem.path);
      return next;
    });
  }, [activeItem]);

  const toggleGroup = (path) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <aside
      className={cx(
        'fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-line bg-sidebar transition-[width] duration-300 lg:flex',
        collapsed ? 'w-[76px]' : 'w-[264px]'
      )}
    >
      <div
        className={cx(
          'flex h-16 shrink-0 items-center border-b border-line',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {collapsed ? <LogoMark size={34} /> : <Logo size={34} />}
        {!collapsed ? (
          <IconButton
            label="Collapse sidebar"
            size="sm"
            icon={PanelLeftClose}
            onClick={() => onToggleCollapsed?.(true)}
          />
        ) : null}
      </div>

      <nav className="cs-scroll-y flex-1 space-y-5 px-2.5 py-4" aria-label="Primary">
        {navGroups.map((group) => (
          <div key={group.group}>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-7 bg-line-2" aria-hidden="true" />
            ) : (
              <p className="cs-eyebrow px-2.5 pb-1.5">{group.group}</p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = [item.path, ...(item.children || []).map((c) => c.path)].some((p) =>
                  matchesPath(location.pathname, p)
                );
                const hasChildren = Boolean(item.children?.length);
                const isOpen = hasChildren && expanded.has(item.path);

                return (
                  <div key={item.path}>
                    <div className="flex items-center gap-1">
                      <NavLink
                        to={item.path}
                        title={collapsed ? item.name : undefined}
                        className={cx('cs-nav-item', isActive && 'cs-nav-item-active', collapsed && 'justify-center px-0')}
                      >
                        {isActive ? <span className="cs-nav-rail" aria-hidden="true" /> : null}
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {!collapsed ? <span className="truncate">{item.name}</span> : null}
                      </NavLink>

                      {hasChildren && !collapsed ? (
                        <button
                          type="button"
                          onClick={() => toggleGroup(item.path)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.name}`}
                          className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          <ChevronDown
                            className={cx('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && isOpen && !collapsed ? (
                      <div className="relative mt-0.5 space-y-0.5">
                        <span className="cs-subnav-spine" aria-hidden="true" />
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            end
                            className={cx(
                              'cs-subnav-item',
                              matchesPath(location.pathname, child.path) && 'cs-subnav-item-active'
                            )}
                          >
                            <span className="truncate">{child.name}</span>
                          </NavLink>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {children ? children({ collapsed, user, usage }) : null}
    </aside>
  );
}
