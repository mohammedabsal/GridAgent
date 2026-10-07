import React, { useEffect, useState } from 'react';
import { ArrowRight, Menu, Play, X } from 'lucide-react';
import { api } from '../services/api';
import type { DashboardState } from '../services/api';
import { APP_ROUTE, BrandMark, NAV_LINKS } from './landing/ui';
import { HeroSection } from './landing/HeroSection';
import {
  FeaturesSection,
  HowItWorksSection,
  UseCasesSection,
} from './landing/FeatureSections';
import {
  AboutSection,
  FinalCtaSection,
  ImpactSection,
  SafetySection,
} from './landing/SafetyImpactSections';

/**
 * Public landing page for GridAgent-AI.
 * All CTAs route into the existing application at /app.
 */
export const Landing: React.FC = () => {
  const [data, setData] = useState<DashboardState | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getDashboard()
      .then((state) => {
        if (!cancelled) setData(state);
      })
      .catch(() => {
        /* Backend offline: the landing page still renders with illustrative visuals. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="ga-landing min-h-screen bg-white font-sans text-slate-900">
      {/* ---------------- Top navigation ---------------- */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="/" aria-label="GridAgent-AI home" className="shrink-0">
            <BrandMark />
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={
                  link.label === 'Home'
                    ? 'border-b-2 border-emerald-600 pb-0.5 text-sm font-semibold text-emerald-700'
                    : 'text-sm font-medium text-slate-600 transition hover:text-emerald-700'
                }
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a
            href={APP_ROUTE}
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md md:inline-flex"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-white">
              <Play className="h-3 w-3 fill-white" />
            </span>
            <span className="text-sm font-bold text-slate-800">
              Launch Application
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
          </a>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <a
              href={APP_ROUTE}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
            >
              Launch Application
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
      </header>

      <main className="landing-main">
        <HeroSection data={data} />
        <FeaturesSection />
        <HowItWorksSection />
        <UseCasesSection />
        <SafetySection />
        <ImpactSection data={data} />
        <AboutSection />
        <FinalCtaSection />

      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="bg-[#072e2a] text-emerald-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <BrandMark invert />
              <p className="mt-4 text-sm text-emerald-100/70">
                Smarter Grids. Cleaner Computing.
              </p>
              <p className="mt-6 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-semibold text-emerald-200">
                Sustainable &amp; Resilient India Innovation Challenge 2026
              </p>
            </div>

            <nav aria-label="Footer navigation">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400/70">
                Explore
              </p>
              <ul className="mt-4 space-y-2.5">
                {NAV_LINKS.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-emerald-50/70 transition hover:text-emerald-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-400/70">
                Application
              </p>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a
                    href={APP_ROUTE}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200"
                  >
                    Launch Application
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-emerald-100/50">
              © 2026 GridAgent-AI — Smarter Grids. Cleaner Computing.
            </p>
            <p className="text-xs text-emerald-100/50">
              Prototype &amp; demonstration project. Grid data provided by the
              built-in simulation engine.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
