import React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight, Menu, Moon, Sparkles, Sun, X, Zap, TrendingUp, Clock } from 'lucide-react';
import { Button, IconButton } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useTheme } from '../theme/ThemeProvider';
import { AuroraBackdrop, FloatingMetric, GridBackdrop } from '../components/marketing/MarketingShared';
import ProductPreview from '../components/marketing/ProductPreview';
import { HowItWorks, TrustedBy } from '../components/marketing/LandingSections';
import { FeatureShowcase } from '../components/marketing/LandingFeatures';
import { ComparisonTable, Testimonials } from '../components/marketing/LandingComparison';
import { FAQ, Pricing } from '../components/marketing/LandingPricing';
import { FinalCTA, MarketingFooter } from '../components/marketing/LandingFooter';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

/** MarketingHeader — sticky navigation for the public landing page. */
function MarketingHeader() {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line cs-glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <NavLink to="/" aria-label="CreatorOS home">
          <Logo size={32} showTagline={false} />
        </NavLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Marketing">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="rounded-md px-3.5 py-2 text-label font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <IconButton
            label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            icon={theme === 'dark' ? Sun : Moon}
            onClick={toggleTheme}
          />
          <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button to="/register" variant="ai" size="sm" iconRight={ArrowRight}>
            Start free
          </Button>
          <IconButton
            label="Toggle menu"
            className="lg:hidden"
            icon={open ? X : Menu}
            onClick={() => setOpen((v) => !v)}
          />
        </div>
      </div>

      {open ? (
        <div className="border-t border-line px-6 py-3 lg:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-label font-medium text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}

/** Hero — headline, dual CTA, floating proof metrics and the product mock. */
function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-16 sm:pt-20">
      <AuroraBackdrop />
      <GridBackdrop />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="cs-badge cs-badge-brand mx-auto">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Next-generation AI content operating system
          </span>

          <h1 className="mt-6 text-[38px] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-[56px]">
            Your AI Operating System
            <br />
            <span className="cs-gradient-text">for high-impact content.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lead leading-relaxed text-ink-2 sm:text-[17px]">
            Stop juggling twelve disconnected tools. Connect your channels, let CreatorOS analyse what already works, then
            plan, create, clip, schedule and monetize from one workspace.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button to="/register" variant="ai" size="lg" iconRight={ArrowRight} className="w-full sm:w-auto">
              Start free
            </Button>
            <Button to="/dashboard" variant="outline" size="lg" className="w-full sm:w-auto">
              Explore the live workspace
            </Button>
          </div>

          <p className="mt-4 text-caption text-ink-3">No credit card • 14-day Creator trial • Cancel anytime</p>
        </div>
        <div className="relative mt-16">
          <FloatingMetric
            label="Time saved this week"
            value="12h 40m"
            icon={Clock}
            className="absolute -left-2 top-8 z-10 hidden cs-anim-float xl:flex"
          />
          <FloatingMetric
            label="Reach lift"
            value="+24.6%"
            delta="30d"
            icon={TrendingUp}
            className="absolute -right-2 top-28 z-10 hidden cs-anim-float xl:flex"
          />
          <FloatingMetric
            label="Clips extracted"
            value="38"
            icon={Zap}
            className="absolute -left-4 bottom-16 z-10 hidden cs-anim-float xl:flex"
          />
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-app text-ink">
      <MarketingHeader />
      <main>
        <Hero />
        <TrustedBy />
        <HowItWorks />
        <FeatureShowcase />
        <ComparisonTable />
        <Testimonials />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
}
