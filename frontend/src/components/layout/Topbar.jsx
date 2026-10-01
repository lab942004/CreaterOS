import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronRight, CircleHelp, Command, Menu, Moon, PenTool,
  RefreshCw, Sun, LogOut, Settings, ShieldCheck, Zap, Building2,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';
import { Menu as MenuPanel } from '../ui/Drawer';
import { useTheme } from '../../theme/ThemeProvider';
import { useToast } from '../ui/ToastProvider';
import { api } from '../../services/api';
import { getBreadcrumbs } from './navUtils';

/**
 * Topbar — global chrome: identity, breadcrumbs, AI search entry point,
 * sync, primary create action, theme switching and account controls.
 */
export default function Topbar({ onOpenMenu, onOpenCommand, user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const crumbs = getBreadcrumbs(location.pathname);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.reAnalyze();
      toast({
        title: 'Workspace synced',
        description: res?.message || 'Omnichannel metrics refreshed.',
        tone: 'success',
      });
    } catch (err) {
      toast({ title: 'Sync failed', description: err.message, tone: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line px-4 cs-glass lg:px-6">
      <IconButton label="Open navigation" className="lg:hidden" icon={Menu} onClick={onOpenMenu} />

      {/* Breadcrumbs */}
      <nav className="hidden min-w-0 flex-1 items-center gap-1.5 md:flex" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={`${crumb.label}-${i}`}>
            {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden="true" /> : null}
            {crumb.path && i === crumbs.length - 1 ? (
              <span className="truncate text-label font-semibold text-ink">{crumb.label}</span>
            ) : crumb.path ? (
              <NavLink
                to={crumb.path}
                className="truncate text-label font-medium text-ink-3 transition-colors hover:text-ink"
              >
                {crumb.label}
              </NavLink>
            ) : (
              <span className="truncate text-label font-medium text-ink-3">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="flex-1 md:hidden" />

      {/* Global AI search */}
      <button
        type="button"
        onClick={onOpenCommand}
        className="group hidden h-9 items-center gap-2.5 rounded-lg border border-line-2 bg-surface-2 px-3 text-left transition-colors hover:border-brand-ring hover:bg-surface-3 sm:flex sm:w-56 xl:w-72"
      >
        <Command className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden="true" />
        <span className="flex-1 truncate text-caption text-ink-3">Search or ask AI…</span>
        <kbd className="hidden items-center gap-0.5 rounded-sm border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ink-3 xl:flex">
          ⌘K
        </kbd>
      </button>

      <IconButton label="Search" className="sm:hidden" icon={Command} onClick={onOpenCommand} />

      {/* AI engine status */}
      <span className="hidden items-center gap-1.5 rounded-pill border border-success/30 bg-success/10 px-2.5 py-1.5 text-caption font-semibold text-success xl:flex">
        <span className="h-1.5 w-1.5 rounded-pill bg-success" aria-hidden="true" />
        AI Active
      </span>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          icon={RefreshCw}
          loading={syncing}
          onClick={handleSync}
          className="hidden sm:inline-flex"
        >
          <span className="hidden lg:inline">{syncing ? 'Syncing' : 'Sync'}</span>
        </Button>

        <Button to="/composer" variant="ai" size="sm" icon={PenTool}>
          <span className="hidden sm:inline">Create</span>
        </Button>

        <IconButton
          label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          icon={theme === 'dark' ? Sun : Moon}
          onClick={toggleTheme}
        />

        <NavLink
          to="/notifications"
          aria-label="Notifications"
          className="relative inline-flex h-[38px] w-[38px] items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-pill bg-brand ring-2 ring-[var(--cs-surface)]" />
        </NavLink>

        <MenuPanel
          align="right"
          trigger={
            <span className="flex items-center gap-2 rounded-md p-0.5 transition-colors hover:bg-surface-2">
              <Avatar src={user?.avatar} name={user?.name || 'Creator'} size="sm" status="online" />
            </span>
          }
          items={[
            { label: 'Workspace settings', icon: Settings, onClick: () => navigate('/settings') },
            { label: 'Team & roles', icon: Building2, onClick: () => navigate('/team') },
            { label: 'Security & sessions', icon: ShieldCheck, onClick: () => navigate('/security') },
            { label: 'Creator Brain', icon: Zap, onClick: () => navigate('/creator-brain') },
            { divider: true },
            { label: 'Help & docs', icon: CircleHelp, onClick: () => navigate('/reports') },
            { label: 'Sign out', icon: LogOut, tone: 'danger', onClick: onLogout },
          ]}
        />
      </div>
    </header>
  );
}
