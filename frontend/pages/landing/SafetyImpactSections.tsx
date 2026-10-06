import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Leaf,
  MessageSquare,
  Sparkles,
  Terminal,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { APP_ROUTE, Reveal, SectionHeading } from './ui';
import type { DashboardState } from '../../services/api';

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

const Stat: React.FC<{
  label: string;
  value: string;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="rounded-2xl border border-emerald-200/70 bg-white p-4">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
      {icon}
    </span>
    <p className="mt-3 text-xl font-extrabold tracking-tight text-[#0d3f3a]">
      {value}
    </p>
    <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </p>
  </div>
);

interface ImpactSectionProps {
  data: DashboardState | null;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({ data }) => {
  const c = data?.comparison;

  return (
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

        {/* Live comparison metrics read from the existing application */}
        {c ? (
          <Reveal delay={120}>
            <div className="mt-8 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Example simulation — current Simulation Lab run
                </p>
                <p className="text-xs font-medium text-slate-500">
                  {c.total_jobs_evaluated} workload
                  {c.total_jobs_evaluated === 1 ? '' : 's'} evaluated
                </p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Carbon reduction"
                  value={`${c.carbon_reduction_percentage.toFixed(1)}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <Stat
                  label="CO₂ saved"
                  value={`${(c.total_carbon_saved_gco2 / 1000).toFixed(2)} kg`}
                  icon={<Leaf className="h-4 w-4" />}
                />
                <Stat
                  label="Cost saved"
                  value={`$${c.total_cost_saved_usd.toFixed(2)}`}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <Stat
                  label="Baseline → Optimized"
                  value={`${(c.baseline_total_emissions_gco2 / 1000).toFixed(1)} → ${(c.optimized_total_emissions_gco2 / 1000).toFixed(1)} kg`}
                  icon={<Sparkles className="h-4 w-4" />}
                />
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                Computed deterministically from simulated workload energy (kWh)
                and hourly carbon intensity (gCO₂/kWh). These figures belong to
                one example simulation run — not a universal product claim.
              </p>
            </div>
          </Reveal>
        ) : (
          <Reveal delay={120}>
            <p className="mt-8 text-center text-sm text-slate-400">
              Launch the demo to generate a measured before / after comparison.
            </p>
          </Reveal>
        )}


      </div>
    </section>
  );
};

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
    title: 'Simulation Lab & Judge Walkthrough',
    caption:
      '24-hour Indian grid profiles, 5 demonstration scenarios and a guided Judge Lifecycle Walkthrough.',
    icon: <Terminal className="h-5 w-5" />,
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

export const FinalCtaSection: React.FC = () => (
  <section className="relative bg-white py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-6 py-14 text-center shadow-2xl shadow-emerald-900/20 sm:px-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl"
          />

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



