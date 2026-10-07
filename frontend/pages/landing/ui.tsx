import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';

/** Route of the existing, fully functional GridAgent application. */
export const APP_ROUTE = '/app';

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'About', href: '#about' },
];

/* ------------------------------------------------------------------ */
/* Reveal-on-scroll wrapper (subtle, performance-friendly animation)  */
/* ------------------------------------------------------------------ */

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ga-reveal ${visible ? 'ga-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Brand mark                                                          */
/* ------------------------------------------------------------------ */

interface BrandMarkProps {
  size?: 'sm' | 'md';
  invert?: boolean;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 'md',
  invert = false,
}) => (
  <span className="flex items-center gap-2.5">
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md shadow-emerald-500/25 ${
        size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
      }`}
    >
      <Zap
        className={`text-white fill-white ${
          size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
        }`}
        strokeWidth={2}
      />
    </span>
    <span className="flex flex-col leading-tight text-left">
      <span
        className={`font-extrabold tracking-tight ${
          size === 'sm' ? 'text-base' : 'text-lg'
        } ${invert ? 'text-white' : 'text-slate-900'}`}
      >
        GridAgent-AI
      </span>
      <span
        className={`text-[11px] font-medium ${
          invert ? 'text-emerald-200/80' : 'text-slate-500'
        }`}
      >
        Smarter Grids. Cleaner Computing.
      </span>
    </span>
  </span>
);

/* ------------------------------------------------------------------ */
/* Section heading                                                     */
/* ------------------------------------------------------------------ */

interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  invert?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  align = 'left',
  invert = false,
}) => (
  <div
    className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
  >
    {eyebrow && (
      <p
        className={`text-xs font-bold uppercase tracking-[0.18em] mb-3 ${
          invert ? 'text-emerald-300' : 'text-emerald-600'
        }`}
      >
        {eyebrow}
      </p>
    )}
    <h2
      className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
        invert ? 'text-white' : 'text-[#0d3f3a]'
      }`}
    >
      {title}
    </h2>
    {description && (
      <p
        className={`mt-4 text-base sm:text-lg leading-relaxed ${
          invert ? 'text-emerald-50/70' : 'text-slate-500'
        }`}
      >
        {description}
      </p>
    )}
  </div>
);
