import React from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BarChart2,
  Brain,
  Calendar,
  Database,
  Leaf,
  ShieldCheck,
  Sun,
  Zap,
  Clock,
  Network,
} from 'lucide-react';
import { Reveal, SectionHeading } from './ui';

/* ------------------------------------------------------------------ */
/* Key Features                                                        */
/* ------------------------------------------------------------------ */

const FEATURES: {
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    title: 'Real Grid Data',
    description:
      'Uses Indian electricity and carbon data to provide meaningful grid intelligence.',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'AI-Powered Decisions',
    description:
      'Analyzes grid conditions, workloads and deadlines to identify cleaner execution windows.',
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: 'Safety First',
    description:
      'Protects critical services and enforces governance policies before execution.',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'Carbon-Aware Scheduling',
    description:
      'Defers flexible workloads to cleaner periods without violating deadlines.',
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: 'MCP Tool Integration',
    description:
      'Connects grid data, workloads, policies and scheduling through a modular tool layer.',
    icon: <Network className="h-5 w-5" />,
  },
  {
    title: 'Measurable Impact',
    description:
      'Compares baseline and optimized execution to quantify carbon and cost impact.',
    icon: <BarChart2 className="h-5 w-5" />,
  },
];

export const FeaturesSection: React.FC = () => (
  <section id="features" className="ga-section bg-white py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14">
        <div className="lg:pt-2">
          <Reveal>
            <SectionHeading
              eyebrow="Key Features"
              title="Intelligent. Autonomous. Climate-Aware."
              description="GridAgent combines grid intelligence, AI reasoning and safety policies to make computing cleaner, safer and more efficient."
            />
          </Reveal>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 70} className="h-full">
              <article className="group h-full rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-600 group-hover:text-white">
                  {f.icon}
                </span>
                <h3 className="mt-4 text-base font-bold text-[#0d3f3a]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {f.description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* How It Works                                                        */
/* ------------------------------------------------------------------ */

const STAGES: { title: string; caption: string; icon: React.ReactNode }[] = [
  {
    title: 'Grid Data',
    caption: 'Electricity and carbon signals',
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: 'Perception Layer',
    caption: 'Carbon intensity, renewables, forecasts',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'GridAgent AI',
    caption: 'Reasoning & decision making',
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: 'Safety Policy',
    caption: 'Allow / Deny / Ask User',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    title: 'Scheduler',
    caption: 'Reschedule / Run / Protect',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: 'Cleaner Future',
    caption: 'Lower-carbon computing',
    icon: <Leaf className="h-5 w-5" />,
  },
];

export const HowItWorksSection: React.FC = () => (
  <section
    id="how-it-works"
    className="ga-section bg-gradient-to-b from-white via-emerald-50/50 to-white py-16 lg:py-24"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="How It Works"
          title="From Grid Data to Cleaner Execution"
          description="Six stages take every workload from a raw grid signal to measurable, policy-safe execution."
        />
      </Reveal>

      <div className="mt-12 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-1">
        {STAGES.map((s, i) => (
          <React.Fragment key={s.title}>
            <Reveal delay={i * 80} className="flex-1">
              <div className="flex h-full flex-col items-center rounded-2xl border border-slate-200/70 bg-white p-5 text-center transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  {s.icon}
                </span>
                <span className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                  {i + 1} / 6
                </span>
                <h3 className="mt-1 text-sm font-extrabold text-[#0d3f3a]">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {s.caption}
                </p>
              </div>
            </Reveal>
            {i < STAGES.length - 1 && (
              <>
                <span className="hidden items-center lg:flex">
                  <ArrowRight className="h-4 w-4 text-emerald-400" />
                </span>
                <span className="flex justify-center lg:hidden">
                  <ArrowDown className="h-4 w-4 text-emerald-400" />
                </span>
              </>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Technology / Architecture                                           */
/* ------------------------------------------------------------------ */

interface ArchLayer {
  name: string;
  caption: string;
  icon: React.ReactNode;
}

const ARCH_LAYERS: ArchLayer[] = [
  {
    name: 'Grid Data',
    caption: 'Indian electricity & carbon signals',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    name: 'Perception',
    caption: 'Carbon intensity, renewables, 24h forecast',
    icon: <Activity className="h-4 w-4" />,
  },
  {
    name: 'AI Reasoning',
    caption: 'Reasoning agent with Pydantic-validated output',
    icon: <Brain className="h-4 w-4" />,
  },
  {
    name: 'Safety Governance',
    caption: 'ALLOW / DENY / ASK_USER policy engine',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    name: 'MCP Tool Layer',
    caption: 'Grid, workload, optimization & safety tools',
    icon: <Network className="h-4 w-4" />,
  },
  {
    name: 'Workload Scheduler',
    caption: 'Defer / run now / protect — deadline aware',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    name: 'Impact Measurement',
    caption: 'Baseline vs optimized carbon & cost',
    icon: <BarChart2 className="h-4 w-4" />,
  },
];

const TECH_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Frontend',
    items: [
      'React 18',
      'TypeScript',
      'Vite',
      'Tailwind CSS',
      'Recharts',
      'Lucide Icons',
    ],
  },
  {
    label: 'Backend',
    items: ['FastAPI', 'Uvicorn', 'Pydantic', 'SQLAlchemy', 'SQLite', 'httpx'],
  },
  {
    label: 'Intelligence',
    items: [
      'Multi-agent pipeline',
      'MCP tool registry',
      'Deterministic policy engine',
      'Google Gemini (optional)',
      'Explainable reasoning',
      'pytest suite',
    ],
  },
];

export const TechnologySection: React.FC = () => (
  <section
    id="technology"
    className="ga-section border-y border-slate-100 bg-slate-50/70 py-16 lg:py-24"
  >
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              eyebrow="Technology"
              title="Built as an Intelligent Orchestration Layer"
              description="GridAgent-AI sits between grid intelligence and enterprise compute — perceiving the grid, reasoning about workloads, enforcing governance, and measuring the outcome."
            />
          </Reveal>

          <div className="mt-8 space-y-5">
            {TECH_GROUPS.map((g, i) => (
              <Reveal key={g.label} delay={i * 80}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                    {g.label}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {g.items.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={240}>
              <p className="text-xs leading-relaxed text-slate-400">
                Grid data currently comes from the built-in SIMULATION provider;
                live data providers can be enabled through configuration. Every
                technology listed exists in this repository.
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal delay={120}>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
              Orchestration flow
            </p>
            <ol>
              {ARCH_LAYERS.map((l, i) => (
                <li key={l.name}>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      {l.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-[#0d3f3a]">
                        {l.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {l.caption}
                      </span>
                    </span>
                  </div>
                  {i < ARCH_LAYERS.length - 1 && (
                    <div className="flex justify-center py-1.5">
                      <ArrowDown className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/* Use Cases                                                           */
/* ------------------------------------------------------------------ */

const USE_CASES: {
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    title: 'AI Model Training',
    description:
      'Training and fine-tuning jobs with flexible start windows can shift to cleaner hours, while deadline-bound inference stays protected.',
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: 'Batch Analytics',
    description:
      'Overnight analytics and reporting batches can wait for a cleaner grid window without missing SLAs.',
    icon: <BarChart2 className="h-5 w-5" />,
  },
  {
    title: 'Data Processing',
    description:
      'Non-urgent ETL and data pipelines can be rescheduled around carbon-intensity peaks.',
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: 'Video Rendering',
    description:
      'Render farms with elastic deadlines can run when renewable generation is abundant.',
    icon: <Sun className="h-5 w-5" />,
  },
  {
    title: 'Cloud Workloads',
    description:
      'Burst and batch cloud workloads can follow the cleanest available execution window.',
    icon: <Activity className="h-5 w-5" />,
  },
  {
    title: 'Enterprise Compute',
    description:
      'Internal batch compute can be orchestrated under governance policies that keep critical services untouched.',
    icon: <Network className="h-5 w-5" />,
  },
];

export const UseCasesSection: React.FC = () => (
  <section id="use-cases" className="ga-section bg-white py-16 lg:py-24">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <Reveal>
        <SectionHeading
          align="center"
          eyebrow="Use Cases"
          title="Flexible workloads, scheduled around carbon"
          description="Any workload with slack in its deadline is a candidate for carbon-aware scheduling — while critical workloads remain protected by policy."
        />
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {USE_CASES.map((u, i) => (
          <Reveal key={u.title} delay={i * 70} className="h-full">
            <article className="group h-full rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-900/5">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                {u.icon}
              </span>
              <h3 className="mt-4 text-base font-bold text-[#0d3f3a]">
                {u.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {u.description}
              </p>
            </article>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-400">
          Demonstrated in GridAgent-AI&apos;s Simulation Lab — not a claim of
          production deployment.
        </p>
      </Reveal>
    </div>
  </section>
);



