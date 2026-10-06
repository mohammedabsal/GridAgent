import React from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  FlaskConical,
  LayoutGrid,
  Layers,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type {
  DashboardState,
  GridHourlyPoint,
  WorkloadJob,
} from '../../services/api';

/**
 * Visual-only representation of the GridAgent application dashboard for the
 * landing page. It displays values read from the existing /api/dashboard
 * endpoint when available, and clearly-captioned illustrative values when the
 * backend is offline. It contains NO application logic.
 */

const FALLBACK_FORECAST: number[] = [
  430, 460, 505, 545, 590, 630, 615, 560, 495, 430, 380, 345, 325, 340, 385,
  455, 545, 625, 675, 660, 615, 560, 500, 455,
];

const segmentColor = (value: number): string =>
  value > 600 ? '#ef4444' : value > 430 ? '#f59e0b' : '#10b981';

const X_LABELS: string[] = [
  '00:00',
  '04:00',
  '08:00',
  '12:00',
  '16:00',
  '20:00',
  '23:00',
];

const ForecastMiniChart: React.FC<{ forecast?: GridHourlyPoint[] }> = ({
  forecast,
}) => {
  const values =
    forecast && forecast.length >= 12
      ? forecast.map((p) => p.carbon_intensity_gco2_kwh)
      : FALLBACK_FORECAST;

  const W = 560;
  const H = 150;
  const padL = 30;
  const padR = 6;
  const padT = 10;
  const padB = 20;
  const maxV = 1000;

  const xAt = (i: number) => padL + (i * (W - padL - padR)) / (values.length - 1);
  const yAt = (v: number) =>
    padT + (1 - Math.min(v, maxV) / maxV) * (H - padT - padB);

  const pts = values.map((v, i) => ({ x: xAt(i), y: yAt(v), v }));
  const baseline = H - padB;
  const areaPath =
    `M ${pts[0].x},${baseline} ` +
    pts.map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L ${pts[pts.length - 1].x},${baseline} Z`;

  const gridValues = [1000, 800, 600, 400, 200, 0];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label="24-hour grid carbon intensity forecast"
    >
      <defs>
        <linearGradient id="gaMockArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridValues.map((g) => (
        <g key={g}>
          <line
            x1={padL}
            x2={W - padR}
            y1={yAt(g)}
            y2={yAt(g)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <text
            x={padL - 5}
            y={yAt(g) + 3}
            textAnchor="end"
            fontSize="8"
            fill="#94a3b8"
          >
            {g.toLocaleString()}
          </text>
        </g>
      ))}

      <path d={areaPath} fill="url(#gaMockArea)" />

      {pts.slice(0, -1).map((p, i) => (
        <line
          key={i}
          x1={p.x}
          y1={p.y}
          x2={pts[i + 1].x}
          y2={pts[i + 1].y}
          stroke={segmentColor((p.v + pts[i + 1].v) / 2)}
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      ))}

      <line
        x1={xAt(21)}
        x2={xAt(21)}
        y1={padT}
        y2={baseline}
        stroke="#0f766e"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />

      {X_LABELS.map((label, i) => (
        <text
          key={label}
          x={xAt(Math.round((i * 23) / 6))}
          y={H - 5}
          textAnchor="middle"
          fontSize="8"
          fill="#94a3b8"
        >
          {label}
        </text>
      ))}
    </svg>
  );
};

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
    active: true,
  },
  { label: 'Grid Intelligence', icon: <Activity className="h-3.5 w-3.5" /> },
  { label: 'Workloads', icon: <Layers className="h-3.5 w-3.5" /> },
  { label: 'Optimization', icon: <Brain className="h-3.5 w-3.5" /> },
  { label: 'Safety & Governance', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  { label: 'MCP Inspector', icon: <Wrench className="h-3.5 w-3.5" /> },
  { label: 'Simulation Lab', icon: <FlaskConical className="h-3.5 w-3.5" /> },
];

interface DecisionRow {
  name: string;
  ref: string;
  chip: string;
  tone: string;
  time: string;
  saved: string;
}

const FALLBACK_ROWS: DecisionRow[] = [
  {
    name: 'AI Model Training',
    ref: '#104',
    chip: 'DEFER',
    tone: 'bg-amber-100 text-amber-700',
    time: '19:00 → 23:00',
    saved: '-4.87 kg CO₂',
  },
  {
    name: 'Batch Analytics',
    ref: '#202',
    chip: 'RUN NOW',
    tone: 'bg-emerald-100 text-emerald-700',
    time: '19:10 → 19:10',
    saved: '-1.23 kg CO₂',
  },
  {
    name: 'Healthcare API',
    ref: '#007',
    chip: 'PROTECTED',
    tone: 'bg-sky-100 text-sky-700',
    time: '19:00 → 19:00',
    saved: '0 kg CO₂',
  },
];

const decisionTone = (w: WorkloadJob): { chip: string; tone: string } => {
  if (w.is_protected_service) {
    return { chip: 'PROTECTED', tone: 'bg-sky-100 text-sky-700' };
  }
  switch (w.decision) {
    case 'DEFER':
      return { chip: 'DEFER', tone: 'bg-amber-100 text-amber-700' };
    case 'BLOCKED_BY_SAFETY':
      return { chip: 'BLOCKED', tone: 'bg-rose-100 text-rose-700' };
    case 'ASK_USER':
      return { chip: 'ASK USER', tone: 'bg-sky-100 text-sky-700' };
    case 'RUN_IMMEDIATELY':
      return { chip: 'RUN NOW', tone: 'bg-emerald-100 text-emerald-700' };
    default:
      break;
  }
  return { chip: w.decision || w.status, tone: 'bg-slate-100 text-slate-600' };
};

const ACTIVE_STATUSES = [
  'RUNNING',
  'QUEUED',
  'DEFERRED',
  'PAUSED',
  'AWAITING_APPROVAL',
];

export const DashboardMockup: React.FC<{ data: DashboardState | null }> = ({
  data,
}) => {
  const gs = data?.grid_status;
  const carbon = Math.round(gs?.carbon_intensity_gco2_kwh ?? 700);
  const renew = gs?.renewable_percentage ?? 18.8;
  const activeWorkloads = (data?.workloads ?? []).filter((w) =>
    ACTIVE_STATUSES.includes(w.status)
  );
  const queued = activeWorkloads.filter((w) => w.status === 'QUEUED').length;
  const savedKg = data ? data.comparison.total_carbon_saved_gco2 / 1000 : 191;
  const reductionPct = data?.comparison.carbon_reduction_percentage;
  const renewTone =
    renew >= 40
      ? 'bg-emerald-100 text-emerald-700'
      : renew >= 20
        ? 'bg-amber-100 text-amber-700'
        : 'bg-rose-100 text-rose-700';
  const renewLabel = renew >= 40 ? 'Strong' : renew >= 20 ? 'Moderate' : 'Low';

  const decided = (data?.workloads ?? []).filter(
    (w) => w.decision || w.is_protected_service
  );
  const liveRows: DecisionRow[] = decided.slice(0, 3).map((w) => {
    const { chip, tone } = decisionTone(w);
    const digits = w.job_id.replace(/[^0-9]/g, '');
    const saved =
      w.estimated_carbon_savings_gco2 > 0
        ? `-${(w.estimated_carbon_savings_gco2 / 1000).toFixed(2)} kg CO₂`
        : '0 kg CO₂';
    return {
      name: w.name,
      ref: `#${digits.slice(-3) || w.job_id}`,
      chip,
      tone,
      time: `${w.submitted_at_time} → ${w.recommended_start_time || w.deadline}`,
      saved,
    };
  });
  const rows: DecisionRow[] =
    liveRows.length > 0 ? liveRows : data ? [] : FALLBACK_ROWS;

  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex">
          {/* Sidebar — mirrors the application's main areas (visual only) */}
          <aside className="hidden w-[172px] shrink-0 flex-col gap-0.5 bg-slate-950 p-3 sm:flex">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600">
                <Activity className="h-3 w-3 text-white" />
              </span>
              <span className="text-xs font-extrabold tracking-tight text-white">
                GridAgent-AI
              </span>
            </div>
            {SIDEBAR_ITEMS.map((item) => (
              <span
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                  item.active
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400'
                }`}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
            <span className="mt-auto rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wider text-emerald-400">
              Simulation Mode
            </span>
          </aside>

          {/* Main panel */}
          <div className="min-w-0 flex-1 bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5">
              <h4 className="truncate text-[13px] font-bold text-slate-800">
                Clean Computing. Smarter Decisions.
              </h4>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">
                {gs?.current_time ?? '15:00'} •{' '}
                {(gs?.is_simulated ?? true)
                  ? 'Simulation'
                  : gs?.data_source ?? 'Grid data'}
              </span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2 px-3 pt-3 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <p className="text-[9.5px] font-semibold text-slate-500">
                  Carbon Intensity
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    {carbon}
                  </span>
                  <span className="text-[8.5px] text-slate-400">gCO₂/kWh</span>
                </div>
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold ${
                    carbon > 600
                      ? 'bg-rose-100 text-rose-600'
                      : carbon > 430
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  ▲ {carbon > 600 ? 'High' : carbon > 430 ? 'Moderate' : 'Low'}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <p className="text-[9.5px] font-semibold text-slate-500">
                  Renewable Share
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    {renew.toFixed(1)}%
                  </span>
                </div>
                <span
                  className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[8.5px] font-bold ${renewTone}`}
                >
                  {renewLabel}
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <p className="text-[9.5px] font-semibold text-slate-500">
                  Active Workloads
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    {data ? activeWorkloads.length : 8}
                  </span>
                </div>
                <span className="mt-1.5 inline-block text-[8.5px] font-semibold text-slate-400">
                  +{data ? queued : 3} queued
                </span>
              </div>

              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <p className="text-[9.5px] font-semibold text-slate-500">
                  CO₂ Saved
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    {Math.round(savedKg)} kg
                  </span>
                </div>
                <span className="mt-1.5 inline-block text-[8.5px] font-bold text-emerald-600">
                  {reductionPct != null
                    ? `+${reductionPct.toFixed(1)}% vs baseline`
                    : 'vs baseline'}
                </span>
              </div>
            </div>

            {/* 24-hour carbon intensity forecast */}
            <div className="px-3 pt-3">
              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-slate-700">
                    Grid Carbon Intensity (Next 24 Hours)
                  </p>
                  <span className="rounded-md bg-teal-700 px-1.5 py-0.5 text-[8px] font-bold text-white">
                    Clean Window 23:00 → 01:00
                  </span>
                </div>
                <ForecastMiniChart forecast={data?.forecast_24h} />
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    High Carbon
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Medium
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Low
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 border-t border-dashed border-teal-700" />
                    Current Time
                  </span>
                </div>
              </div>
            </div>

            {/* Recent AI decisions */}
            <div className="px-3 pb-3 pt-3">
              <div className="rounded-xl border border-slate-200/80 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-700">
                    Recent AI Decisions
                  </p>
                  <span className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-600">
                    Explainable
                    <ArrowRight className="h-2.5 w-2.5" />
                  </span>
                </div>
                {rows.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <div
                        key={`${r.ref}-${r.name}`}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">
                          {r.name}{' '}
                          <span className="font-normal text-slate-400">
                            {r.ref}
                          </span>
                        </span>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold ${r.tone}`}
                        >
                          {r.chip}
                        </span>
                        <span className="hidden shrink-0 font-mono text-[8.5px] text-slate-400 md:block">
                          {r.time}
                        </span>
                        <span className="shrink-0 text-[8.5px] font-bold text-emerald-600">
                          {r.saved}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-[9.5px] leading-relaxed text-slate-400">
                    No AI decisions yet — run a demonstration scenario in the
                    Simulation Lab to watch PERCEIVE → REASON → SAFETY →
                    EXECUTE.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[11px] leading-relaxed text-slate-400">
        Product visualization of the GridAgent-AI dashboard.{' '}
        {data
          ? 'Metrics shown are read from the current Simulation Lab run.'
          : 'Values shown are illustrative.'}
      </figcaption>
    </figure>
  );
};


