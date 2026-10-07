import React from 'react';
import { ArrowRight, Leaf, ShieldCheck, Zap } from 'lucide-react';
import { APP_ROUTE, Reveal } from './ui';
import type { DashboardState } from '../../services/api';
import {
  INDIA_GRATICULE,
  INDIA_GRID_NODES,
  INDIA_ISLAND_DOTS,
  INDIA_REGIONS,
  INDIA_VIEWBOX,
} from './indiaMap';

/* ------------------------------------------------------------------ */
/* Detailed India map + clean-energy grid backdrop (decorative only)   */
/* Geometry lives in ./indiaMap.ts (real state/UT borders, projected    */
/* city nodes). Coordinates below index into INDIA_GRID_NODES.          */
/* ------------------------------------------------------------------ */

/* Transmission lines drawn between the projected city grid nodes */
const GRID_EDGES: [number, number][] = [
  [0, 8], // New Delhi - Jaipur
  [0, 6], // New Delhi - Ahmedabad
  [0, 4], // New Delhi - Kolkata
  [6, 1], // Ahmedabad - Mumbai
  [8, 1], // Jaipur - Mumbai
  [1, 5], // Mumbai - Hyderabad
  [5, 2], // Hyderabad - Bengaluru
  [5, 3], // Hyderabad - Chennai
  [2, 3], // Bengaluru - Chennai
  [4, 7], // Kolkata - Guwahati
  [1, 9], // Mumbai - Kochi
  [3, 4], // Chennai - Kolkata
];

/* Per-city label placement so names never collide with the nodes */
const NODE_LABELS: Record<
  string,
  { anchor: 'start' | 'middle' | 'end'; dx: number; dy: number }
> = {
  'New Delhi': { anchor: 'start', dx: 16, dy: 8 },
  Jaipur: { anchor: 'end', dx: -16, dy: 8 },
  Ahmedabad: { anchor: 'start', dx: 16, dy: 8 },
  Mumbai: { anchor: 'end', dx: -16, dy: 8 },
  Kochi: { anchor: 'end', dx: -16, dy: 8 },
  Bengaluru: { anchor: 'middle', dx: 0, dy: 32 },
  Chennai: { anchor: 'start', dx: 16, dy: 12 },
  Hyderabad: { anchor: 'start', dx: 16, dy: 8 },
  Kolkata: { anchor: 'start', dx: 16, dy: 8 },
  Guwahati: { anchor: 'start', dx: 16, dy: 8 },
};

const [, , VB_W, VB_H] = INDIA_VIEWBOX.split(' ').map(Number);

const IndiaBackdrop: React.FC = () => (
  <svg
    viewBox={INDIA_VIEWBOX}
    className="h-full w-full"
    aria-hidden="true"
    focusable="false"
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="gaIndiaFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d1fae5" />
        <stop offset="55%" stopColor="#a7f3d0" />
        <stop offset="100%" stopColor="#99f6e4" />
      </linearGradient>
      <filter
        id="gaIndiaShadow"
        filterUnits="userSpaceOnUse"
        x="-100"
        y="-100"
        width={VB_W + 200}
        height={VB_H + 200}
      >
        <feDropShadow
          dx="0"
          dy="16"
          stdDeviation="24"
          floodColor="#047857"
          floodOpacity="0.20"
        />
      </filter>
      {/* Everything below is painted only inside the country silhouette */}
      <clipPath id="gaIndiaClip">
        {INDIA_REGIONS.map((r) => (
          <path key={r.id} d={r.d} />
        ))}
      </clipPath>
    </defs>

    {/* 1. Coastline silhouette: thick under-stroke, half of which peeks out
        from beneath the fill layer to form a crisp outer edge */}
    <g filter="url(#gaIndiaShadow)">
      {INDIA_REGIONS.map((r) => (
        <path
          key={r.id}
          d={r.d}
          fill="#a7f3d0"
          stroke="#059669"
          strokeOpacity="0.55"
          strokeWidth={7}
          strokeLinejoin="round"
        />
      ))}
    </g>

    {/* 2. State / union-territory fills with internal borders */}
    {INDIA_REGIONS.map((r) => (
      <path
        key={r.id}
        d={r.d}
        fill="url(#gaIndiaFill)"
        stroke="#059669"
        strokeOpacity="0.35"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    ))}

    {/* 3. Faint 5-degree graticule, clipped to the country */}
    <g
      clipPath="url(#gaIndiaClip)"
      stroke="#047857"
      strokeOpacity="0.14"
      strokeWidth={1.2}
    >
      {INDIA_GRATICULE.verticals.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={VB_H} />
      ))}
      {INDIA_GRATICULE.horizontals.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={VB_W} y2={y} />
      ))}
    </g>

    {/* 4. Animated transmission lines between grid nodes */}
    {GRID_EDGES.map(([a, b], i) => (
      <line
        key={i}
        x1={INDIA_GRID_NODES[a].x}
        y1={INDIA_GRID_NODES[a].y}
        x2={INDIA_GRID_NODES[b].x}
        y2={INDIA_GRID_NODES[b].y}
        stroke="#059669"
        strokeOpacity="0.5"
        strokeWidth={1.8}
        strokeDasharray="7 7"
        className="ga-dash-flow"
        style={{ animationDelay: `${i * 0.3}s` }}
      />
    ))}

    {/* 5. City grid nodes with pulsing halos and labels */}
    {INDIA_GRID_NODES.map((n, i) => {
      const lb = NODE_LABELS[n.name] ?? { anchor: 'middle', dx: 0, dy: -18 };
      return (
        <g key={n.name}>
          <circle
            cx={n.x}
            cy={n.y}
            r={17}
            fill="#10b981"
            className="ga-node-halo"
            style={{ animationDelay: `${i * 0.4}s` }}
          />
          <circle
            cx={n.x}
            cy={n.y}
            r={6.5}
            fill="#047857"
            stroke="#ffffff"
            strokeWidth={2.5}
          />
          <text
            x={n.x + lb.dx}
            y={n.y + lb.dy}
            textAnchor={lb.anchor}
            fontSize={26}
            fontWeight={700}
            fill="#0f766e"
            stroke="#ffffff"
            strokeWidth={5}
            strokeLinejoin="round"
            style={{ paintOrder: 'stroke' }}
          >
            {n.name}
          </text>
        </g>
      );
    })}

    {/* 6. Lakshadweep islets (kept as dots — too small for path detail) */}
    {INDIA_ISLAND_DOTS.map((d) => (
      <circle
        key={d.name}
        cx={d.x}
        cy={d.y}
        r={5}
        fill="#059669"
        fillOpacity={0.75}
        stroke="#ffffff"
        strokeWidth={1.5}
      />
    ))}
  </svg>
);

const Turbine: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 80 120" className={className} aria-hidden="true">
    <path
      d="M37.5 62 L42.5 62 L41 116 L39 116 Z"
      fill="#0f766e"
      opacity="0.3"
    />
    <g className="ga-rotor">
      <g transform="translate(40 58)">
        <path
          d="M0,-4 Q2.5,-24 0,-34 Q-2.5,-24 0,-4 Z"
          fill="#0f766e"
          opacity="0.35"
        />
        <path
          d="M0,-4 Q2.5,-24 0,-34 Q-2.5,-24 0,-4 Z"
          fill="#0f766e"
          opacity="0.35"
          transform="rotate(120)"
        />
        <path
          d="M0,-4 Q2.5,-24 0,-34 Q-2.5,-24 0,-4 Z"
          fill="#0f766e"
          opacity="0.35"
          transform="rotate(240)"
        />
        <circle cx="0" cy="0" r="3.5" fill="#0f766e" opacity="0.5" />
      </g>
    </g>
  </svg>
);

const SolarPanel: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 90 60" className={className} aria-hidden="true">
    <path d="M14 44 L74 12 L86 12 L26 44 Z" fill="#0f766e" opacity="0.22" />
    <path
      d="M26 44 L86 12 M20 47 L80 15 M38 44 L32 47 M56 34 L50 37 M72 25 L66 28"
      stroke="#0f766e"
      strokeOpacity="0.35"
      strokeWidth="1.2"
      fill="none"
    />
    <path d="M44 40 L46 56 L50 56 L48 40 Z" fill="#0f766e" opacity="0.3" />
  </svg>
);

const Skyline: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 220 80" className={className} aria-hidden="true">
    <g fill="#334155" opacity="0.14">
      <rect x="8" y="38" width="22" height="42" rx="2" />
      <rect x="36" y="24" width="18" height="56" rx="2" />
      <rect x="60" y="46" width="26" height="34" rx="2" />
      <rect x="94" y="14" width="20" height="66" rx="2" />
      <rect x="122" y="34" width="24" height="46" rx="2" />
      <rect x="154" y="26" width="16" height="54" rx="2" />
      <rect x="178" y="44" width="30" height="36" rx="2" />
    </g>
  </svg>
);

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

interface HeroSectionProps {
  data: DashboardState | null;
}

const BENEFITS: { label: string; caption: string; icon: React.ReactNode }[] = [
  {
    label: 'LOWER',
    caption: 'Carbon Emissions',
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    label: 'SMARTER',
    caption: 'Workload Scheduling',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    label: 'SAFER',
    caption: 'Operations',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

export const HeroSection: React.FC<HeroSectionProps> = ({ data }) => (
  <section
    id="home"
    className="ga-section relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-emerald-200/25 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-32 top-24 h-[420px] w-[420px] rounded-full bg-teal-100/50 blur-3xl"
    />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
        {/* ---------------- Left: copy ---------------- */}
        <div className="max-w-xl">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              Sustainable &amp; Resilient India Innovation Challenge 2026
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.06] tracking-tight text-[#0d3f3a]">
              <span className="block">GridAgent-AI</span>
              <span className="block">The AI that schedules</span>
              <span className="block">
                for a <span className="text-emerald-600">cleaner tomorrow</span>.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-500">
              GridAgent-AI is an AI-driven carbon-aware workload orchestration
              platform that intelligently schedules flexible computational
              workloads around grid carbon intensity while enforcing safety
              policies for critical workloads.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              {BENEFITS.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    {b.icon}
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-extrabold tracking-wide text-[#0d3f3a]">
                      {b.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {b.caption}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={APP_ROUTE}
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:shadow-emerald-700/30"
              >
                Try the Demo
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
              >
                How It Works
              </a>
            </div>
          </Reveal>
        </div>

        {/* ---------------- Right: product visualization ---------------- */}
        <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[560px]">
          {/* Decorative India / clean-energy backdrop (visual only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="ga-float absolute -right-[3%] -top-[2%] h-[104%] w-[84%] sm:w-[78%] opacity-90">
              <IndiaBackdrop />
            </div>
            <Skyline className="absolute bottom-[3%] right-0 w-64" />
            <Turbine className="absolute bottom-[14%] right-[2%] w-16" />
            <Turbine className="absolute bottom-[6%] right-[16%] w-12 opacity-80" />
            <SolarPanel className="absolute bottom-[1%] right-[24%] w-24" />
            <span className="ga-hand absolute right-[4%] top-[-46px] rotate-[-6deg] text-2xl font-semibold leading-tight text-teal-700/80">
              A cleaner grid
              <br />
              for a greener India
            </span>
          </div>


        </div>

      </div>
    </div>
  </section>
);

export default HeroSection;


