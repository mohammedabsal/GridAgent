import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { APP_ROUTE, Reveal, SectionHeading } from './ui';
import { ImpactGaugeIllustration } from './illustrations';

/* ------------------------------------------------------------------ */
/* Safety & Governance                                                 */
/* ------------------------------------------------------------------ */

interface PolicyCard {
  token: string;
  role: string;
  description: string;
  rules: string[];
  accent: string;
  icon: React.ReactNode;
}

const POLICIES: PolicyCard[] = [
  {
    token: 'ALLOW',
    role: 'Flexible workloads',
    description:
      'Deadline-safe, interruptible workloads are cleared for carbon-aware scheduling within defined limits.',
    rules: ['ALLOW_WORKLOAD_TYPES'],
    accent: 'text-emerald-300',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    token: 'DENY',
    role: 'Mission-critical workloads',
    description:
      'Protected services are never deferred or rescheduled, and deadlines are never silently violated.',
    rules: ['DENY_PROTECTED_WORKLOAD', 'DENY_DEADLINE_VIOLATION'],
    accent: 'text-rose-300',
    icon: <XCircle className="h-5 w-5" />,
  },
  {
    token: 'ASK_USER',
    role: 'High-impact or sensitive operations',
    description:
      'Sensitive, high-cost or tight-deadline operations pause for explicit human approval before execution.',
    rules: [
      'ASK_USER_SENSITIVE_TYPE',
      'ASK_USER_RESOURCE_THRESHOLD_EXCEEDED',
    ],
    accent: 'text-amber-300',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

export const SafetySection: React.FC = () => (
  <section
    id="safety"
    className="ga-section relative overflow-hidden bg-[#072e2a] py-16 lg:py-24"
  >
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-[0.06]"
      style={{
        backgroundImage:
          'linear-gradient(#5eead4 1px, transparent 1px), linear-gradient(90deg, #5eead4 1px, transparent 1px)',
        backgroundSize: '52px 52px',
      }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
    />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          invert
          eyebrow="Safety & Governance"
          title="Carbon optimization should never compromise reliability."
          description="Every decision passes through a deterministic policy engine before anything executes. The AI agent can reason — but it can never override a DENY."
        />
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {POLICIES.map((p, i) => (
          <Reveal key={p.token} delay={i * 90} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-emerald-400/30 hover:bg-white/[0.06]">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ${p.accent}`}
                >
                  {p.icon}
                </span>
                <span
                  className={`font-mono text-lg font-extrabold tracking-wider ${p.accent}`}
                >
                  {p.token}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-white">
                {p.role}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-emerald-50/60">
                {p.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.rules.map((r) => (
                  <span
                    key={r}
                    className="rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-[10px] text-emerald-200/80"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <blockquote className="mx-auto mt-10 max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-6 text-center md:p-8">
          <p className="text-lg font-bold leading-relaxed text-white md:text-xl">
            GridAgent does not blindly optimize.{' '}
            <span className="text-emerald-300">
              It reasons within defined safety boundaries.
            </span>
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-emerald-100/50">
            PERCEIVE → REASON → SAFETY CHECK → EXECUTE
          </p>
        </blockquote>
      </Reveal>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Impact: Before → After                                              */
/* ------------------------------------------------------------------ */

const BEFORE_STEPS: string[] = [
  'Fixed execution',
  'Carbon-blind scheduling',
  'Higher potential emissions',
];

const AFTER_STEPS: string[] = [
  'Grid perception',
  'AI reasoning',
  'Safety validation',
  'Carbon-aware scheduling',
  'Measured impact',
];

export const ImpactSection: React.FC = () => (
    <section id="impact" className="ga-section bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Impact"
            title="Same workloads. Cleaner execution."
            description="GridAgent-AI compares a fixed baseline schedule against its carbon-aware decisions — so the impact of every run is measurable, not assumed."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* BEFORE */}
          <Reveal className="h-full">
            <div className="h-full rounded-3xl border border-slate-200 bg-slate-50 p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Before
                </span>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-600">
                  Traditional Static Scheduling
                </span>
              </div>
              <ol className="mt-6 space-y-3">
                {BEFORE_STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <li className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-500">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                      {s}
                    </li>
                    {i < BEFORE_STEPS.length - 1 && (
                      <li aria-hidden="true" className="pl-4">
                        <ArrowDown className="h-4 w-4 text-slate-300" />
                      </li>
                    )}
                  </React.Fragment>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* AFTER */}
          <Reveal className="h-full">
            <div className="h-full rounded-3xl border border-emerald-300/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-7 shadow-lg shadow-emerald-900/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                  After
                </span>
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
                  GridAgent-AI
                </span>
              </div>
              <ol className="mt-6 space-y-3">
                {AFTER_STEPS.map((s, i) => (
                  <React.Fragment key={s}>
                    <li className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-white px-4 py-3.5 text-sm font-bold text-[#0d3f3a] shadow-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      {s}
                    </li>
                    {i < AFTER_STEPS.length - 1 && (
                      <li aria-hidden="true" className="pl-4">
                        <ArrowDown className="h-4 w-4 text-emerald-400" />
                      </li>
                    )}
                  </React.Fragment>
                ))}
              </ol>
            </div>
          </Reveal>

        </div>

        <Reveal delay={160}>
          <div className="mx-auto mt-12 max-w-xl">
            <ImpactGaugeIllustration />
          </div>
          <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">
            Illustrative emissions curve as flexible workloads shift from a dirty
            baseline into progressively cleaner execution windows.
          </p>
        </Reveal>
      </div>
    </section>
  );

/* ------------------------------------------------------------------ */
/* About                                                               */
/* ------------------------------------------------------------------ */

const ABOUT_POINTS: {
  title: string;
  caption: string;
  icon: React.ReactNode;
}[] = [
  {
    title: 'Multi-agent pipeline',
    caption:
      'PERCEIVE → REASON → SAFETY CHECK → EXECUTE, with specialised agents for perception, reasoning, safety and execution.',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    title: 'Explainable, validated decisions',
    caption:
      'Pydantic-validated decision output with human-readable reasoning attached to every scheduling decision.',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    title: 'Governance & audit trail',
    caption:
      'Every ALLOW / DENY / ASK_USER ruling is recorded in the policy audit log for review.',
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

export const AboutSection: React.FC = () => (
  <section
    id="about"
    className="ga-section border-y border-slate-100 bg-slate-50/70 py-16 lg:py-24"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="About"
              title="A carbon-aware computing prototype for India's clean digital future"
              description="GridAgent-AI was built for the Sustainable & Resilient India Innovation Challenge 2026 to show how AI can make enterprise computing cleaner without compromising reliability."
            />
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-slate-500">
              <p>
                The platform pairs a deterministic grid perception layer with an
                AI reasoning agent, a non-bypassable safety policy engine, and a
                modular MCP tool layer that connects grid data, workloads,
                policies and scheduling.
              </p>
              <p>
                It runs locally on simulated Indian grid data by default.
                Optional Google Gemini integration enriches reasoning
                explanations when an API key is configured — the safety policy
                engine stays deterministic either way.
              </p>
            </div>
          </Reveal>
        </div>

        <div className="space-y-4">
          {ABOUT_POINTS.map((p, i) => (
            <Reveal key={p.title} delay={i * 80}>
              <div className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  {p.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#0d3f3a]">
                    {p.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {p.caption}
                  </span>
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

/* Decorative clean-energy scene etched into the gradient panel:
   solar array, transmission towers with flowing power, and wind
   turbines. Decorative only — hidden from assistive tech. */
const CtaIllustration: React.FC = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    viewBox="0 0 1200 220"
    preserveAspectRatio="xMidYMax slice"
    className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full sm:h-48"
  >
    {/* Sun with slow-rotating rays */}
    <g transform="translate(1062 52)">
      <circle r="20" fill="#ffffff" fillOpacity="0.16" />
      <circle r="28" fill="none" stroke="#ffffff" strokeOpacity="0.16" strokeWidth="1.5" />
      <g className="ga-spin-slow" style={{ animationDuration: '60s' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <line
            key={i}
            x1="0"
            y1="-34"
            x2="0"
            y2="-40"
            stroke="#ffffff"
            strokeOpacity="0.28"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${i * 30})`}
          />
        ))}
      </g>
    </g>

    {/* Ground line */}
    <path
      d="M0 198 Q300 186 600 194 T1200 190"
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.25"
      strokeWidth="1.5"
    />

    {/* Solar array (left) */}
    <g stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.07">
      {[80, 200, 320].map((x) => (
        <g key={x}>
          <path d={`M${x} 190 L${x + 14} 156 L${x + 96} 156 L${x + 82} 190 Z`} />
          <line x1={x + 30} y1="156" x2={x + 18} y2="190" strokeOpacity="0.2" />
          <line x1={x + 52} y1="156" x2={x + 40} y2="190" strokeOpacity="0.2" />
          <line x1={x + 74} y1="156" x2={x + 62} y2="190" strokeOpacity="0.2" />
          <line x1={x + 7} y1="173" x2={x + 89} y2="173" strokeOpacity="0.2" />
        </g>
      ))}
    </g>

    {/* Transmission towers + flowing power lines (center) */}
    <g
      fill="none"
      stroke="#ffffff"
      strokeOpacity="0.32"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      {/* towers */}
      <path d="M470 196 L492 96 M530 196 L508 96" />
      <path d="M478 160 L522 160 M483 138 L517 138 M488 116 L512 116" />
      <path d="M470 120 L530 120 M478 120 L474 132 M522 120 L526 132" />
      <path d="M476 104 L524 104 M482 104 L479 114 M518 104 L521 114" />
      <path d="M500 96 L500 86" />

      <path d="M620 196 L642 108 M680 196 L658 108" />
      <path d="M628 166 L672 166 M633 146 L667 146 M638 126 L662 126" />
      <path d="M630 130 L670 130 M638 130 L635 140 M662 130 L665 140" />
      <path d="M636 114 L664 114 M642 114 L640 122 M658 114 L660 122" />
      <path d="M650 108 L650 98" />

      {/* sagging power lines — animated flow */}
      <path className="ga-flow" d="M380 132 Q435 152 470 122" strokeOpacity="0.5" />
      <path className="ga-flow" d="M500 86 Q575 128 650 98" strokeOpacity="0.5" />
      <path className="ga-flow" d="M530 122 Q575 148 620 130" strokeOpacity="0.5" />
      <path className="ga-flow" d="M670 130 Q725 150 770 128" strokeOpacity="0.5" />
      <path className="ga-flow" d="M470 122 Q485 132 500 120" strokeOpacity="0.5" />
    </g>

    {/* Wind turbines (right) */}
    {[
      { x: 850, hub: 92, r: 40, dur: '11s' },
      { x: 960, hub: 120, r: 30, dur: '14s' },
      { x: 1140, hub: 104, r: 34, dur: '12.5s' },
    ].map((t) => (
      <g key={t.x}>
        <path
          d={`M${t.x - 4} 196 L${t.x - 1.5} ${t.hub} L${t.x + 1.5} ${t.hub} L${t.x + 4} 196 Z`}
          fill="#ffffff"
          fillOpacity="0.14"
          stroke="#ffffff"
          strokeOpacity="0.3"
          strokeWidth="1.2"
        />
        <g transform={`translate(${t.x} ${t.hub})`}>
          <g
            className="ga-spin-slow"
            style={{ animationDuration: t.dur }}
            fill="#ffffff"
            fillOpacity="0.2"
            stroke="#ffffff"
            strokeOpacity="0.38"
            strokeWidth="1.2"
            strokeLinejoin="round"
          >
            <path d={`M0 -3 L-4 -${t.r} L4 -${t.r} Z`} />
            <path d={`M0 -3 L-4 -${t.r} L4 -${t.r} Z`} transform="rotate(120)" />
            <path d={`M0 -3 L-4 -${t.r} L4 -${t.r} Z`} transform="rotate(240)" />
          </g>
          <circle r="4" fill="#ffffff" fillOpacity="0.35" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1" />
        </g>
      </g>
    ))}

    {/* Two distant birds */}
    <g fill="none" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round">
      <path d="M180 60 Q187 53 194 60 Q201 53 208 60" />
      <path d="M240 44 Q245 39 250 44 Q255 39 260 44" />
    </g>
  </svg>
);

export const FinalCtaSection: React.FC = () => (
  <section className="relative bg-white py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 pb-52 pt-14 text-center shadow-2xl shadow-emerald-900/20 sm:px-12 sm:pb-60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
          />
          <CtaIllustration />

          <h2 className="relative mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Make computing cleaner, without compromising what matters.
          </h2>
          <p className="relative mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-emerald-50/80 sm:text-base">
            Explore how GridAgent-AI turns grid intelligence into safer,
            carbon-aware workload decisions.
          </p>
          <a
            href={APP_ROUTE}
            className="group relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-extrabold text-emerald-800 shadow-lg transition hover:bg-emerald-50 hover:shadow-xl"
          >
            Launch GridAgent-AI
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </a>
        </div>
      </Reveal>
    </div>
  </section>
);



