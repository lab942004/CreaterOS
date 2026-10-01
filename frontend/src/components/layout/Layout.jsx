import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cx } from '../ui/cn';
import Sidebar from './Sidebar';
import SidebarFooter from './SidebarFooter';
import Topbar from './Topbar';
import CommandPalette from './CommandPalette';
import { MobileNav, MobileDrawer } from './MobileNav';
import { api } from '../../services/api';

const COLLAPSE_KEY = 'creatoros_sidebar_collapsed';

/**
 * Layout — the authenticated application shell.
 * Owns navigation state (rail collapse, mobile drawer, command palette),
 * resolves the signed-in identity and provides the page canvas.
 */
export default function Layout({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [usage, setUsage] = useState(null);

  // Persist the rail preference.
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — preference is simply not persisted */
    }
  }, [collapsed]);

  // Resolve identity + plan usage for the shell chrome.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.getMe();
        if (!cancelled) setUser(me?.user || null);
      } catch {
        /* unauthenticated: the shell still renders with defaults */
      }
      try {
        const billing = await api.getBilling();
        const used = billing?.usage?.aiTokensUsed || 0;
        const limit = billing?.usage?.aiTokenLimit || 500000;
        if (!cancelled) {
          setUsage({
            planName: billing?.currentPlan || 'Creator Pro',
            tokensUsed: used,
            tokenLimit: limit,
            tokenPercent: limit ? Math.round((used / limit) * 100) : 0,
          });
        }
      } catch {
        /* billing is non-critical chrome */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Global command palette shortcut.
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem('creatoros_token');
    } catch {
      /* ignore */
    }
    navigate('/login');
  }, [navigate]);

  const handle = user ? { ...user, handle: `@${String(user.email || '').split('@')[0]}` } : null;

  return (
    <div className="min-h-screen bg-app text-ink">
      <Sidebar collapsed={collapsed} onToggleCollapsed={setCollapsed}>
        {({ collapsed: isCollapsed }) => (
          <SidebarFooter
            collapsed={isCollapsed}
            onToggleCollapsed={setCollapsed}
            onLogout={handleLogout}
            user={handle}
            usage={usage}
          />
        )}
      </Sidebar>

      <div className={cx('flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 lg:pl-[264px]', collapsed && 'lg:pl-[76px]')}>
        <Topbar
          onOpenMenu={() => setMobileMenuOpen(true)}
          onOpenCommand={() => setCommandOpen(true)}
          user={handle}
          onLogout={handleLogout}
        />

        <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">{children}</main>
      </div>

      <MobileNav onOpenMenu={() => setMobileMenuOpen(true)} />
      <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} user={handle} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
