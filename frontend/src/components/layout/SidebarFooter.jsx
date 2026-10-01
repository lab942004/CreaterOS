import React from 'react';
import { LogOut, PanelLeft, Sparkles } from 'lucide-react';
import { cx } from '../ui/cn';
import { Avatar } from '../ui/Avatar';
import { Button, IconButton } from '../ui/Button';
import { ProgressBar } from '../ui/Progress';

/**
 * SidebarFooter — plan usage + identity block that anchors the bottom of the
 * navigation rail. Collapses into a single "expand" control on the icon rail.
 */
export function SidebarFooter({ collapsed, onToggleCollapsed, onLogout, user, usage }) {
  return (
    <div className={cx('shrink-0 border-t border-line', collapsed ? 'p-2.5' : 'p-3')}>
      {collapsed ? (
        <div className="space-y-2">
          <IconButton label="Expand sidebar" size="sm" icon={PanelLeft} onClick={() => onToggleCollapsed?.(false)} />
          <IconButton
            label="Sign out"
            size="sm"
            icon={LogOut}
            onClick={onLogout}
            className="mx-auto flex"
          />
        </div>
      ) : (
        <>
          <div className="cs-ai-surface mb-3 rounded-xl p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-caption font-semibold text-ink">
                <Sparkles className="h-3.5 w-3.5 text-brand" aria-hidden="true" />
                {usage?.planName || 'Creator Pro'}
              </span>
              <span className="cs-badge cs-badge-brand cs-badge-sm">Active</span>
            </div>
            <p className="mt-1 text-caption text-ink-3">
              {(usage?.tokensUsed || 0).toLocaleString()} /{' '}
              {Math.round((usage?.tokenLimit || 500000) / 1000)}k AI tokens
            </p>
            <ProgressBar className="mt-2" value={usage?.tokenPercent} />
            <Button to="/settings" variant="soft" size="sm" full className="mt-2.5">
              Manage plan
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-2.5 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar src={user?.avatar} name={user?.name || 'Creator'} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-caption font-semibold text-ink">{user?.name || 'Creator'}</p>
                <p className="truncate text-caption text-ink-3">{user?.handle || '@creator'}</p>
              </div>
            </div>
            <IconButton label="Sign out" size="sm" icon={LogOut} onClick={onLogout} />
          </div>
        </>
      )}
    </div>
  );
}

export default SidebarFooter;
