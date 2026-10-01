import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Bot, Home, Layers, Menu, X } from 'lucide-react';
import { cx } from '../ui/cn';
import { Logo } from '../ui/Logo';
import { navGroups } from './navigationConfig';
import { matchesPath } from './navUtils';

const TABS = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Content', path: '/content', icon: Layers },
  { label: 'AI', path: '/ai', icon: Bot },
];

/** MobileNav — bottom tab bar for the four highest-frequency destinations. */
export function MobileNav({ onOpenMenu }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-line px-1 pb-[env(safe-area-inset-bottom)] cs-glass lg:hidden"
      aria-label="Primary"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            cx(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-caption font-semibold transition-colors',
              isActive || matchesPath(window.location.pathname, tab.path) ? 'text-brand' : 'text-ink-3'
            )
          }
        >
          <tab.icon className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} aria-hidden="true" />
          {tab.label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-caption font-semibold text-ink-3 transition-colors hover:text-ink"
      >
        <Menu style={{ height: 18, width: 18 }} aria-hidden="true" />
        More
      </button>
    </nav>
  );
}

/** MobileDrawer — full navigation tree for small viewports. */
export function MobileDrawer({ open, onClose, onLogout, user }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex lg:hidden">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm cs-anim-in" onClick={onClose} role="presentation" />
      <aside className="relative z-10 flex h-full w-[298px] flex-col border-r border-line bg-sidebar cs-anim-in">
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <Logo size={32} showTagline={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-4.5 w-4.5" style={{ height: 18, width: 18 }} aria-hidden="true" />
          </button>
        </div>

        <nav className="cs-scroll-y flex-1 space-y-5 p-3" aria-label="All destinations">
          {navGroups.map((group) => (
            <div key={group.group}>
              <p className="cs-eyebrow px-2.5 pb-1.5">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <React.Fragment key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cx(
                        'cs-nav-item',
                        matchesPath(window.location.pathname, item.path) && 'cs-nav-item-active'
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                    {(item.children || [])
                      .filter((child) => child.path !== item.path)
                      .map((child) => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={cx(
                            'cs-subnav-item',
                            matchesPath(window.location.pathname, child.path) && 'cs-subnav-item-active'
                          )}
                        >
                          <span className="truncate">{child.name}</span>
                        </NavLink>
                      ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-caption font-semibold text-ink">{user?.name || 'Creator'}</p>
              <p className="truncate text-caption text-ink-3">{user?.email || 'creator@creatoros.ai'}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md px-2 py-1 text-caption font-semibold text-error transition-colors hover:bg-error/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default MobileNav;
