import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Check, Moon, Sun } from 'lucide-react';
import { cx } from '../ui/cn';
import { Logo } from '../ui/Logo';
import { IconButton } from '../ui/Button';
import { useTheme } from '../../theme/ThemeProvider';

const DEFAULT_POINTS = [
  'Unified analytics across six networks',
  'A Content DNA score on every asset',
  'AI strategy grounded in your own data',
  'Clipping, scheduling and monetization in one place',
];

/**
 * AuthShell — split-screen frame shared by every authentication screen.
 * Left: brand story. Right: the form. Collapses to a single column on mobile.
 */
export default function AuthShell({
  title,
  subtitle,
  headline = 'Run your content like a system, not a scramble.',
  points = DEFAULT_POINTS,
  children,
  footer,
}) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-app text-ink">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] max-w-[620px] shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-app-2 p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 cs-aurora" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 cs-grid-overlay" aria-hidden="true" />

        <div className="relative">
          <NavLink to="/" aria-label="CreatorOS home">
            <Logo size={36} />
          </NavLink>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[32px] font-extrabold leading-[1.15] tracking-tight text-ink xl:text-[38px]">
            {headline}
          </h2>
          <ul className="mt-8 space-y-3.5">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-label text-ink-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill bg-brand-soft text-brand">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="cs-glass rounded-xl border border-line p-4">
            <p className="text-label leading-relaxed text-ink-2">
              “Content DNA showed me the exact hook pattern behind my three best months. I stopped guessing.”
            </p>
            <p className="mt-3 text-caption font-semibold text-ink-3">Maya Okonkwo • Tech educator</p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between px-5 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2 text-caption font-semibold text-ink-3 hover:text-ink lg:invisible">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to site
          </NavLink>
          <div className="flex items-center gap-1.5">
            <IconButton
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              icon={theme === 'dark' ? Sun : Moon}
              onClick={toggleTheme}
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12 lg:px-8">
          <div className="w-full max-w-[400px] cs-anim-up">
            <div className="mb-6 lg:hidden">
              <Logo size={34} showTagline={false} />
            </div>

            <h1 className="text-[26px] font-bold tracking-tight text-ink">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-label text-ink-2">{subtitle}</p> : null}

            <div className={cx('mt-7')}>{children}</div>

            {footer ? <div className="mt-6 text-center text-label text-ink-2">{footer}</div> : null}
          </div>
        </div>
      </main>
    </div>
  );
}
