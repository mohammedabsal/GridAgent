import React, { useEffect, useRef, useState } from 'react';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';
import {
  AnimatedNumber,
  JUDGE_MODE_SCENES,
  usePrefersReducedMotion,
} from './motion';

interface DigitalTwinCanvasProps {
  grid: GridStatus;
  forecast24h: GridHourlyPoint[];
  workload: WorkloadJob;
  onSelectHour: (hour: number) => void;
  demoStep?: number | null;
}

type HoverNode =
  | 'solar'
  | 'wind'
  | 'grid'
  | 'datacenter'
  | 'workload'
  | 'reschedule'
  | null;

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  grid,
  forecast24h,
  workload,
  onSelectHour,
  demoStep,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [highlightWorkloadPath, setHighlightWorkloadPath] =
    useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<HoverNode>(null);
  const [hourPulse, setHourPulse] = useState<boolean>(false);
  const prevStateRef = useRef<{
    hour: number;
    time: string;
    carbon: number;
    renewable: number;
  }>({
    hour: grid.current_hour,
    time: grid.current_time,
    carbon: grid.carbon_intensity_gco2_kwh,
    renewable: grid.renewable_percentage,
  });
  const [lastTransition, setLastTransition] = useState<{
    fromTime: string;
    toTime: string;
    deltaCarbon: number;
    deltaRenewable: number;
  } | null>(null);

  // Subtle background-only parallax so interactive elements never shift under the cursor
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const currentHour = grid.current_hour;
  const carbon = grid.carbon_intensity_gco2_kwh;
  const renewable = grid.renewable_percentage;
  const solarMw = grid.solar_generation_mw;
  const windMw = grid.wind_generation_mw;

  useEffect(() => {
    const prev = prevStateRef.current;
    if (prev.hour !== currentHour) {
      setLastTransition({
        fromTime: prev.time,
        toTime: grid.current_time,
        deltaCarbon: Math.round(carbon - prev.carbon),
        deltaRenewable: Math.round(renewable - prev.renewable),
      });
      setHourPulse(true);
      prevStateRef.current = {
        hour: currentHour,
        time: grid.current_time,
        carbon,
        renewable,
      };
      const timer = window.setTimeout(() => setHourPulse(false), 900);
      return () => window.clearTimeout(timer);
    }
  }, [currentHour, grid.current_time, carbon, renewable]);

  const isHighCarbon = carbon >= 550;
  const isCleanCarbon = carbon <= 420;

  const recStartStr = workload.recommended_start_time || '17:00';
  const recHour = parseInt(recStartStr.split(':')[0], 10);
  const deadlineStr = workload.deadline || '20:00';
  const deadlineHour = parseInt(deadlineStr.split(':')[0], 10);
  const submitTimeStr = workload.submitted_at_time || '15:00';
  const submitHour = parseInt(submitTimeStr.split(':')[0], 10);

  // Find Solar Peak hour in the active 24h forecast (typically 12:00 or 13:00)
  const solarPeakHour = forecast24h.reduce(
    (bestH, pt) =>
      pt.solar_generation_mw >
      (forecast24h.find((x) => x.hour === bestH)?.solar_generation_mw ?? -1)
        ? pt.hour
        : bestH,
    12
  );

  const isExecutingAtCurrentHour =
    workload.status === 'RUNNING' ||
    (workload.decision === 'DEFER' && currentHour === recHour) ||
    (workload.decision === 'RUN_NOW' && currentHour === submitHour);

  const isCompletedAtCurrentHour =
    workload.status === 'COMPLETED' ||
    (workload.decision === 'DEFER' && currentHour > recHour);

  const isDeferredWaiting =
    workload.decision === 'DEFER' && currentHour < recHour;

  const governanceState: 'ALLOWED' | 'ASK USER' | 'BLOCKED' =
    workload.policy_decision === 'DENY' ||
    workload.status === 'BLOCKED' ||
    workload.is_protected_service
      ? 'BLOCKED'
      : workload.policy_decision === 'ASK_USER' ||
        workload.status === 'AWAITING_APPROVAL'
      ? 'ASK USER'
      : 'ALLOWED';

  // Semantic colors driven strictly by real application carbon state
  const gridStateColor = isCleanCarbon
    ? '#10B981'
    : isHighCarbon
    ? '#EF4444'
    : '#F59E0B';

  const gridStateText = isCleanCarbon
    ? 'CLEAN WINDOW'
    : isHighCarbon
    ? 'HIGH CARBON'
    : 'MODERATE CARBON';

  const atmosphereClass = isCleanCarbon
    ? 'ga-twin-atmosphere-clean'
    : isHighCarbon
    ? 'ga-twin-atmosphere-high'
    : 'ga-twin-atmosphere-moderate';

  // Dynamic hourly cluster load % so every hour on the timeline updates Data Center telemetry & active racks
  const dynamicClusterLoadPct = isExecutingAtCurrentHour
    ? 78
    : currentHour === submitHour
    ? 52
    : isCompletedAtCurrentHour
    ? Math.max(32, Math.min(46, Math.round((grid.demand_mw / 3600) * 42)))
    : Math.max(28, Math.min(58, Math.round((grid.demand_mw / 3400) * 48)));

  // Compute node visualization (12 3D racks: 2 aisles of 6)
  const activeNodesCount = isExecutingAtCurrentHour
    ? 10
    : Math.max(3, Math.min(11, Math.round((dynamicClusterLoadPct / 100) * 12)));

  // Data-driven animation intensities & speeds
  const solarIntensity = Math.min(1, Math.max(0.08, solarMw / 2000));
  const solarFlowDur =
    solarMw >= 1200 ? '1.35s' : solarMw >= 500 ? '2.0s' : '3.1s';
  const windFlowDur =
    windMw >= 900 ? '1.4s' : windMw >= 450 ? '2.1s' : '3.0s';
  const windRotorDur =
    windMw >= 1000 ? '2.5s' : windMw >= 550 ? '3.7s' : '5.4s';
  const gridFlowDur = isExecutingAtCurrentHour ? '1.15s' : '1.85s';

  // Emissions metrics (in kgCO2) derived from existing workload fields + live selected hour
  const baselineCarbonIntensity = Math.round(
    workload.current_carbon_intensity ?? 700
  );
  const optimizedCarbonIntensity = Math.round(
    workload.predicted_carbon_intensity ?? 390
  );
  const baselineKgCo2 =
    (workload.baseline_emissions_gco2 ||
      workload.energy_kwh * baselineCarbonIntensity) / 1000;
  const optimizedKgCo2 =
    (workload.optimized_emissions_gco2 ||
      workload.energy_kwh * optimizedCarbonIntensity) / 1000;
  const selectedHourKgCo2 = (workload.energy_kwh * carbon) / 1000;
  const savedKgCo2 = Math.max(
    0,
    workload.estimated_carbon_savings_gco2
      ? workload.estimated_carbon_savings_gco2 / 1000
      : baselineKgCo2 - optimizedKgCo2
  );
  const maxEmissionsKg = Math.max(1, baselineKgCo2, optimizedKgCo2, selectedHourKgCo2);
  const baselineBarWidth = Math.round((baselineKgCo2 / maxEmissionsKg) * 164);
  const optimizedBarWidth = Math.max(
    18,
    Math.round((optimizedKgCo2 / maxEmissionsKg) * 164)
  );

  const cleanWorkloadName = (() => {
    const raw = workload.name
      .replace(/\s*\([^)]*\)\s*$/, '')
      .trim()
      .toUpperCase();
    return raw.length > 22 ? `${raw.slice(0, 21)}…` : raw;
  })();

  const hoveredPoint =
    hoveredHour !== null
      ? forecast24h.find((p) => p.hour === hoveredHour) || null
      : null;

  const inspectedPoint =
    hoveredPoint ||
    forecast24h.find((p) => p.hour === currentHour) ||
    forecast24h[0] ||
    null;

  const activeJudgeScene =
    demoStep !== null && demoStep !== undefined
      ? JUDGE_MODE_SCENES.find((s) => s.scene === demoStep) || null
      : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setHoveredNode(null);
  };

  const bgTransform = reducedMotion
    ? undefined
    : `translate3d(${(mouseOffset.x * 2.5).toFixed(1)}px, ${(
        mouseOffset.y * 2.5
      ).toFixed(1)}px, 0)`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-lg ga-twin-surface">
      {/* =====================================================================
          HEADER BAR: DIGITAL TWIN STATUS, TOP TIME SCRUBBER & QUICK-JUMP BAR
      ===================================================================== */}
      <div className="px-4 py-2.5 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-[#0d3f3a]">
              DIGITAL TWIN SIMULATION
            </h2>

            {grid.is_simulated ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-sm text-[11px] font-mono text-[#0d3f3a]">
                <span className="h-2 w-2 rounded-full bg-[#10B981] ga-pulse-subtle" />
                SIMULATION MODE
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 shadow-sm text-[11px] font-mono font-semibold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                LIVE GRID ({grid.data_source})
              </span>
            )}

            {/* Active Simulation Mode / State Pill */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tabular-nums border transition-all duration-300 ${
                currentHour === recHour
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/25'
                  : currentHour === submitHour
                  ? 'bg-rose-50 text-rose-700 border-rose-300'
                  : currentHour === solarPeakHour
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-sky-50 text-sky-800 border-sky-300'
              }`}
            >
              {currentHour === recHour
                ? `★ OPTIMAL CLEAN WINDOW (${grid.current_time})`
                : currentHour === submitHour
                ? `● BASELINE PEAK HOUR (${grid.current_time})`
                : currentHour === solarPeakHour
                ? `☀ SOLAR PEAK WINDOW (${grid.current_time})`
                : currentHour >= deadlineHour
                ? `⏱ SLA DEADLINE WINDOW (${grid.current_time})`
                : `◎ SELECTED HOUR (${grid.current_time})`}
            </span>

            {lastTransition && (
              <span
                className={`hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums border transition-all duration-300 ${
                  hourPulse
                    ? 'bg-emerald-100 border-emerald-400 text-[#0d3f3a] font-bold scale-[1.02]'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                <span>
                  {lastTransition.fromTime} → {lastTransition.toTime}:
                </span>
                <span
                  className={
                    lastTransition.deltaCarbon <= 0
                      ? 'text-emerald-700 font-semibold'
                      : 'text-rose-600 font-semibold'
                  }
                >
                  {lastTransition.deltaCarbon <= 0 ? '' : '+'}
                  {lastTransition.deltaCarbon} gCO₂
                </span>
                <span>·</span>
                <span
                  className={
                    lastTransition.deltaRenewable >= 0
                      ? 'text-emerald-700 font-semibold'
                      : 'text-amber-700 font-semibold'
                  }
                >
                  {lastTransition.deltaRenewable >= 0 ? '+' : ''}
                  {lastTransition.deltaRenewable}% RE
                </span>
              </span>
            )}
          </div>

          {/* Quick-Jump Milestone Buttons so User Can Test Key Hours Instantly Above the Fold */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 mr-0.5 hidden sm:inline">
              Jump:
            </span>
            <button
              type="button"
              onClick={() => onSelectHour(12)}
              className={`px-2 py-1 rounded-lg border transition tabular-nums whitespace-nowrap ${
                currentHour === 12
                  ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-700'
              }`}
            >
              ☀ 12:00 Solar
            </button>
            <button
              type="button"
              onClick={() => onSelectHour(submitHour)}
              className={`px-2 py-1 rounded-lg border transition tabular-nums whitespace-nowrap ${
                currentHour === submitHour
                  ? 'bg-rose-600 text-white border-rose-600 font-bold shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-700'
              }`}
            >
              ⚡ {submitTimeStr} Baseline
            </button>
            <button
              type="button"
              onClick={() => onSelectHour(recHour)}
              className={`px-2.5 py-1 rounded-lg border transition tabular-nums whitespace-nowrap ${
                currentHour === recHour
                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-semibold'
              }`}
            >
              ★ {recStartStr} Optimal
            </button>
            <button
              type="button"
              onClick={() => onSelectHour(deadlineHour)}
              className={`px-2 py-1 rounded-lg border transition tabular-nums whitespace-nowrap ${
                currentHour === deadlineHour
                  ? 'bg-amber-600 text-white border-amber-600 font-bold shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400 hover:text-amber-700'
              }`}
            >
              ⏱ {deadlineStr} SLA
            </button>
          </div>
        </div>

        {/* Docked Interactive Time Scrubber directly above the 2.5D Digital Twin */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-1 border-t border-slate-200/70">
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onSelectHour((currentHour + 23) % 24)}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-mono font-semibold text-[#0d3f3a] transition"
              title="Previous Hour (-1h)"
            >
              -1h
            </button>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0d3f3a] text-white text-xs font-mono font-bold tabular-nums whitespace-nowrap">
              {grid.current_time} IST
            </span>
            <button
              type="button"
              onClick={() => onSelectHour((currentHour + 1) % 24)}
              className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-mono font-semibold text-[#0d3f3a] transition"
              title="Next Hour (+1h)"
            >
              +1h
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              00:00
            </span>
            <input
              type="range"
              min={0}
              max={23}
              value={currentHour}
              onChange={(e) => onSelectHour(Number(e.target.value))}
              aria-label="Top Digital Twin Time Scrubber"
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />
            <span className="text-[10px] font-mono tabular-nums text-slate-400">
              23:00
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0 text-[11px] font-mono tabular-nums text-slate-600">
            <span className="whitespace-nowrap">
              Grid:{' '}
              <strong style={{ color: gridStateColor }}>
                {Math.round(carbon)} gCO₂/kWh
              </strong>
            </span>
            <span className="text-slate-300">|</span>
            <span className="whitespace-nowrap">
              RE: <strong className="text-[#10B981]">{renewable.toFixed(1)}%</strong>{' '}
              ({Math.round(solarMw + windMw)} MW)
            </span>
            <span className="text-slate-300">|</span>
            <span className="whitespace-nowrap">
              DC Load: <strong className="text-[#0d3f3a]">{dynamicClusterLoadPct}%</strong>
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN DIGITAL TWIN VIRTUAL ENVIRONMENT & TELEMETRY SIDEBAR
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
        {/* LEFT COLUMN (3 cols): REAL SYSTEM VS DIGITAL TWIN MODEL + TELEMETRY */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 p-4 flex flex-col justify-between bg-gradient-to-b from-slate-50/90 to-white">
          <div className="space-y-3.5">
            <div
              className={`rounded-xl border p-2.5 transition-all duration-300 ${
                hourPulse
                  ? 'border-emerald-400 bg-emerald-50/70 shadow-sm'
                  : 'border-slate-200/80 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                  SIMULATION CLOCK
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors duration-300 whitespace-nowrap"
                  style={{
                    color: gridStateColor,
                    borderColor: `${gridStateColor}45`,
                    backgroundColor: `${gridStateColor}14`,
                  }}
                >
                  {gridStateText}
                </span>
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="text-2xl font-mono font-bold tabular-nums text-[#0d3f3a]">
                  {grid.current_time}
                </span>
                <span className="text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                  Tariff: ${grid.electricity_price_usd_kwh.toFixed(3)}/kWh
                </span>
              </div>
            </div>

            {/* Real System -> Digital Twin Mapping Table */}
            <div>
              <div className="grid grid-cols-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 pb-1.5 border-b border-slate-200/80">
                <span>PARAMETER</span>
                <span className="text-right">LIVE TWIN STATE</span>
              </div>
              <div className="divide-y divide-slate-200/70 text-xs">
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Cloud workload</span>
                  <span className="font-mono tabular-nums text-[#0d3f3a] font-semibold">
                    {workload.job_id}
                  </span>
                </div>
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Carbon intensity</span>
                  <span
                    className="font-mono font-bold tabular-nums whitespace-nowrap transition-colors duration-300"
                    style={{ color: gridStateColor }}
                  >
                    <AnimatedNumber
                      value={carbon}
                      decimals={0}
                      suffix=" gCO₂/kWh"
                    />
                  </span>
                </div>
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Renewable share</span>
                  <span className="font-mono tabular-nums whitespace-nowrap text-[#10B981] font-semibold">
                    <AnimatedNumber
                      value={renewable}
                      decimals={1}
                      suffix="%"
                    />{' '}
                    (
                    <AnimatedNumber
                      value={solarMw + windMw}
                      decimals={0}
                      suffix=" MW"
                    />
                    )
                  </span>
                </div>
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Solar / Wind</span>
                  <span className="font-mono tabular-nums whitespace-nowrap text-slate-700 font-medium">
                    ☀ {Math.round(solarMw)} · ≋ {Math.round(windMw)} MW
                  </span>
                </div>
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Cluster load</span>
                  <span className="font-mono tabular-nums whitespace-nowrap text-[#0d3f3a] font-semibold">
                    {dynamicClusterLoadPct}% ({activeNodesCount}/12 nodes)
                  </span>
                </div>
                <div className="py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-500">Workload status</span>
                  <span
                    className={`font-mono font-bold whitespace-nowrap transition-colors duration-300 ${
                      isExecutingAtCurrentHour
                        ? 'text-[#10B981]'
                        : isCompletedAtCurrentHour
                        ? 'text-sky-600'
                        : isDeferredWaiting
                        ? 'text-amber-600'
                        : 'text-[#3B82F6]'
                    }`}
                  >
                    {isExecutingAtCurrentHour
                      ? `RUNNING (${grid.current_time})`
                      : isCompletedAtCurrentHour
                      ? `COMPLETED ✓`
                      : isDeferredWaiting
                      ? `DEFERRED → ${recStartStr}`
                      : workload.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Hour vs Baseline vs Optimal Live Comparison Card */}
            <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-2.5 space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500">
                <span>HOUR COMPARISON ({workload.energy_kwh} kWh)</span>
                <span className="text-emerald-700 font-bold">
                  -{workload.carbon_reduction_pct.toFixed(1)}% OPTIMAL
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center pt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectHour(submitHour)}
                  className={`rounded-lg border p-1.5 transition ${
                    currentHour === submitHour
                      ? 'border-rose-400 bg-rose-50 ring-1 ring-rose-300'
                      : 'border-slate-200 bg-white hover:border-rose-300'
                  }`}
                >
                  <div className="text-[9px] text-slate-500">
                    BASE {submitTimeStr}
                  </div>
                  <div className="font-bold tabular-nums text-rose-600">
                    {baselineKgCo2.toFixed(1)} kg
                  </div>
                </button>
                <div className="rounded-lg border border-sky-300 bg-sky-50/70 p-1.5">
                  <div className="text-[9px] text-sky-700 font-semibold">
                    NOW {grid.current_time}
                  </div>
                  <div className="font-bold tabular-nums text-[#0d3f3a]">
                    {selectedHourKgCo2.toFixed(1)} kg
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectHour(recHour)}
                  className={`rounded-lg border p-1.5 transition ${
                    currentHour === recHour
                      ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-400'
                      : 'border-emerald-200 bg-white hover:border-emerald-400'
                  }`}
                >
                  <div className="text-[9px] text-emerald-700 font-semibold">
                    BEST {recStartStr}
                  </div>
                  <div className="font-bold tabular-nums text-emerald-600">
                    {optimizedKgCo2.toFixed(1)} kg
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Active Workload Entity Card (Hover highlights path in Digital Twin) */}
          <div
            onMouseEnter={() => setHighlightWorkloadPath(true)}
            onMouseLeave={() => setHighlightWorkloadPath(false)}
            className="mt-3 pt-3 border-t border-slate-200 space-y-2 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                TARGET WORKLOAD
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border whitespace-nowrap ${
                  governanceState === 'ALLOWED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ga-safety-allow'
                    : governanceState === 'ASK USER'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 ga-safety-ask'
                    : 'bg-rose-50 border-rose-300 text-rose-700 ga-safety-block'
                }`}
              >
                {governanceState === 'ALLOWED'
                  ? '✓ SAFE TO WAIT'
                  : governanceState === 'ASK USER'
                  ? '⚠ APPROVAL REQ'
                  : '✕ PROTECTED'}
              </span>
            </div>
            <div
              title={workload.name}
              className="text-xs font-bold text-[#0d3f3a] truncate"
            >
              {workload.name}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="bg-white border border-slate-200/90 shadow-sm px-2.5 py-1.5 rounded-xl">
                <div className="text-slate-500 text-[9px]">ENERGY DRAW</div>
                <div className="text-[#0d3f3a] font-bold tabular-nums whitespace-nowrap">
                  {workload.energy_kwh} kWh
                </div>
              </div>
              <div className="bg-white border border-slate-200/90 shadow-sm px-2.5 py-1.5 rounded-xl">
                <div className="text-slate-500 text-[9px]">SLA DEADLINE</div>
                <div className="text-[#0d3f3a] font-bold tabular-nums whitespace-nowrap">
                  {workload.deadline}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT COLUMN (9 cols): CINEMATIC 2.5D VIRTUAL ENERGY & DATA CENTER SIMULATION */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`lg:col-span-9 p-2.5 md:p-4 relative flex flex-col justify-center overflow-hidden ga-twin-surface ${atmosphereClass}`}
        >
          {/* Subtle atmospheric background grid with restrained parallax */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30 transition-transform duration-200 ease-out"
            style={{
              backgroundImage:
                'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              transform: bgTransform,
            }}
          />

          {/* CINEMATIC 2.5D DIGITAL TWIN WORLD VIEWPORT */}
          <div
            className={`relative z-10 w-full rounded-xl overflow-hidden border shadow-2xl bg-[#07101F] transition-all duration-300 ${
              hourPulse
                ? 'border-emerald-400 ring-2 ring-emerald-400/35'
                : 'border-slate-800/80'
            }`}
          >
            <svg
              viewBox="0 0 920 472"
              className="w-full h-auto max-h-[472px] select-none block"
              role="img"
              aria-label="Digital Twin Virtual Simulation: Solar Farm, Wind Farm, High-Voltage Grid Substation, 3D Data Center Facility, and AI Workload Execution Dock"
            >
              <defs>
                {/* Stage & Terrain Gradients */}
                <linearGradient id="worldSkyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#060D1A" />
                  <stop offset="45%" stopColor="#0B172A" />
                  <stop offset="100%" stopColor="#091323" />
                </linearGradient>

                <radialGradient id="ambientGridAura" cx="50%" cy="32%" r="45%">
                  <stop
                    offset="0%"
                    stopColor={gridStateColor}
                    stopOpacity="0.22"
                  />
                  <stop
                    offset="60%"
                    stopColor={gridStateColor}
                    stopOpacity="0.06"
                  />
                  <stop
                    offset="100%"
                    stopColor={gridStateColor}
                    stopOpacity="0"
                  />
                </radialGradient>

                <radialGradient
                  id="sunCoronaGrad"
                  cx="50%"
                  cy="50%"
                  r="50%"
                >
                  <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
                  <stop
                    offset="35%"
                    stopColor="#FBBF24"
                    stopOpacity={0.85 * solarIntensity}
                  />
                  <stop
                    offset="70%"
                    stopColor="#F59E0B"
                    stopOpacity={0.35 * solarIntensity}
                  />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="sunRayGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#FDE047"
                    stopOpacity={0.34 * solarIntensity}
                  />
                  <stop
                    offset="65%"
                    stopColor="#34D399"
                    stopOpacity={0.12 * solarIntensity}
                  />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>

                {/* Photovoltaic Silicon Panel Surface Gradient */}
                <linearGradient id="pvPanelGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0C2D57" />
                  <stop offset="50%" stopColor="#1E3A8A" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>

                {/* Travelling Specular Shimmer Across Solar Array */}
                <linearGradient id="pvShimmerGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                  <stop
                    offset="50%"
                    stopColor="#FEF08A"
                    stopOpacity={0.38 * solarIntensity}
                  />
                  <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>

                {/* Wind Turbine Tower Cylindrical Shading */}
                <linearGradient id="turbineTowerGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#94A3B8" />
                  <stop offset="40%" stopColor="#F1F5F9" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>

                {/* Data Center Reflective Floor */}
                <linearGradient id="dcFloorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#081120" />
                  <stop offset="100%" stopColor="#0D1B32" />
                </linearGradient>

                {/* Isometric Platform Pad Surface */}
                <linearGradient id="isoPadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111F36" />
                  <stop offset="100%" stopColor="#0A1424" />
                </linearGradient>

                {/* Glow Filters */}
                <filter
                  id="particleGlow"
                  x="-60%"
                  y="-60%"
                  width="220%"
                  height="220%"
                >
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                <filter
                  id="softDropShadow"
                  x="-15%"
                  y="-15%"
                  width="130%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="6"
                    stdDeviation="6"
                    floodColor="#020617"
                    floodOpacity="0.65"
                  />
                </filter>

                <filter
                  id="limeGlow"
                  x="-25%"
                  y="-25%"
                  width="150%"
                  height="150%"
                >
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="5"
                    floodColor="#10B981"
                    floodOpacity="0.45"
                  />
                </filter>

                {/* Motion Paths for Energy & Workload Simulation */}
                <path
                  id="path-solar-to-grid"
                  d="M 252 108 L 308 108 L 340 108"
                />
                <path
                  id="path-wind-to-grid"
                  d="M 668 108 L 612 108 L 580 108"
                />
                <path id="path-grid-dc-left" d="M 434 176 L 434 206" />
                <path id="path-grid-dc-right" d="M 486 176 L 486 206" />
                <path
                  id="path-reschedule-arc"
                  d="M 218 286 C 224 286, 228 286, 234 286"
                />
                <path
                  id="path-workload-shift"
                  d="M 384 422 C 414 404, 444 404, 474 422"
                />
                <path id="path-dc-workload-left" d="M 442 368 L 442 388" />
                <path id="path-dc-workload-right" d="M 478 368 L 478 388" />
              </defs>

              {/* =============================================================
                  WORLD BACKGROUND & ISOMETRIC TERRAIN PERSPECTIVE GRID
              ============================================================= */}
              <rect
                x="0"
                y="0"
                width="920"
                height="472"
                fill="url(#worldSkyGrad)"
              />
              <ellipse
                cx="460"
                cy="155"
                rx="380"
                ry="165"
                fill="url(#ambientGridAura)"
              />

              {/* Perspective Horizon & Ground Plane Grid Lines */}
              <g opacity="0.22" stroke="#1E293B" strokeWidth="1">
                {[48, 92, 136, 184, 236, 292, 352, 416, 464].map((y) => (
                  <line key={`hz-${y}`} x1="0" y1={y} x2="920" y2={y} />
                ))}
                {[-120, 0, 115, 230, 345, 460, 575, 690, 805, 920, 1040].map(
                  (x, idx) => (
                    <line
                      key={`vt-${idx}`}
                      x1={460 + (x - 460) * 0.55}
                      y1="18"
                      x2={x}
                      y2="472"
                    />
                  )
                )}
              </g>

              {/* =============================================================
                  ZONE 1A (TOP-LEFT): MINIATURE 3D SOLAR FARM
              ============================================================= */}
              <g
                transform="translate(16, 14)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('solar')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Isometric Terrain Platform Base */}
                <rect
                  x="0"
                  y="0"
                  width="292"
                  height="162"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter="url(#softDropShadow)"
                  stroke={
                    hourPulse || hoveredNode === 'solar' || renewable >= 35
                      ? '#10B981'
                      : '#1E293B'
                  }
                  strokeWidth={
                    hourPulse || hoveredNode === 'solar' || renewable >= 35
                      ? '1.8'
                      : '1.2'
                  }
                />
                {/* 3D Platform Side Bevel */}
                <path
                  d="M 4 162 L 288 162 L 284 166 L 8 166 Z"
                  fill="#064E3B"
                  opacity="0.65"
                />

                {/* Virtual Sun with Luminous Corona (Top-Right of Solar Pad) */}
                <g transform="translate(248, 34)">
                  <circle
                    cx="0"
                    cy="0"
                    r={20 + solarIntensity * 13}
                    fill="url(#sunCoronaGrad)"
                  />
                  <circle
                    cx="0"
                    cy="0"
                    r="8.5"
                    fill={solarMw > 0 ? '#FEF08A' : '#475569'}
                    stroke={solarMw > 0 ? '#F59E0B' : '#64748B'}
                    strokeWidth="1.5"
                  />
                  {!reducedMotion && solarMw > 0 && (
                    <circle
                      cx="0"
                      cy="0"
                      r="13"
                      fill="none"
                      stroke="#FDE047"
                      strokeWidth="1"
                      strokeDasharray="3 5"
                      opacity={0.75 * solarIntensity}
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 0 0"
                        to="360 0 0"
                        dur="18s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                </g>

                {/* Directional Sunlight Beams Reaching the PV Array */}
                {solarMw > 0 && (
                  <g pointerEvents="none">
                    <polygon
                      points="240,40 196,52 162,118 208,116"
                      fill="url(#sunRayGrad)"
                    />
                    <polygon
                      points="236,36 138,54 96,118 158,118"
                      fill="url(#sunRayGrad)"
                    />
                    <polygon
                      points="232,32 76,56 32,114 92,118"
                      fill="url(#sunRayGrad)"
                    />
                  </g>
                )}

                {/* 3 Rows x 4 Isometric Dark-Blue Photovoltaic Panels */}
                <g transform="translate(22, 50)">
                  {[0, 1, 2].map((row) =>
                    [0, 1, 2, 3].map((col) => {
                      const px = col * 46 + row * 4;
                      const py = row * 22;
                      return (
                        <g
                          key={`pv-${row}-${col}`}
                          transform={`translate(${px}, ${py})`}
                        >
                          {/* Panel Ground Shadow */}
                          <polygon
                            points="4,17 42,17 37,21 -1,21"
                            fill="#020617"
                            opacity="0.7"
                          />
                          {/* Metal Support Strut */}
                          <line
                            x1="19"
                            y1="14"
                            x2="19"
                            y2="19"
                            stroke="#475569"
                            strokeWidth="1.6"
                          />
                          {/* Isometric Slanted PV Module */}
                          <polygon
                            points="6,0 44,0 38,15 0,15"
                            fill="url(#pvPanelGrad)"
                            stroke={
                              renewable >= 35 ? '#34D399' : '#38BDF8'
                            }
                            strokeOpacity={0.55 + 0.35 * solarIntensity}
                            strokeWidth="0.9"
                          />
                          {/* Photovoltaic Silicon Cell Grid Lines */}
                          <line
                            x1="3"
                            y1="7.5"
                            x2="41"
                            y2="7.5"
                            stroke="#93C5FD"
                            strokeOpacity="0.28"
                            strokeWidth="0.6"
                          />
                          <line
                            x1="15"
                            y1="0.5"
                            x2="10"
                            y2="14.5"
                            stroke="#93C5FD"
                            strokeOpacity="0.25"
                            strokeWidth="0.6"
                          />
                          <line
                            x1="25"
                            y1="0.5"
                            x2="20"
                            y2="14.5"
                            stroke="#93C5FD"
                            strokeOpacity="0.25"
                            strokeWidth="0.6"
                          />
                          <line
                            x1="35"
                            y1="0.5"
                            x2="30"
                            y2="14.5"
                            stroke="#93C5FD"
                            strokeOpacity="0.25"
                            strokeWidth="0.6"
                          />
                        </g>
                      );
                    })
                  )}

                  {/* Travelling Specular Highlight Across Panel Surfaces */}
                  {!reducedMotion && solarMw > 0 && (
                    <rect
                      x="-20"
                      y="0"
                      width="36"
                      height="64"
                      fill="url(#pvShimmerGrad)"
                      transform="skewX(-22)"
                    >
                      <animate
                        attributeName="x"
                        from="-30"
                        to="220"
                        dur="3.6s"
                        repeatCount="indefinite"
                      />
                    </rect>
                  )}

                  {/* Fine Electric-Lime & Gold Energy Particles Rising from Panels */}
                  {!reducedMotion && solarMw > 0 && (
                    <>
                      <circle
                        cx="42"
                        cy="32"
                        r="2"
                        fill="#FDE047"
                        filter="url(#particleGlow)"
                      >
                        <animate
                          attributeName="cx"
                          values="42;120;204"
                          dur={solarFlowDur}
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          values="32;38;44"
                          dur={solarFlowDur}
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx="88"
                        cy="18"
                        r="2.2"
                        fill="#34D399"
                        filter="url(#particleGlow)"
                      >
                        <animate
                          attributeName="cx"
                          values="88;154;204"
                          dur={solarFlowDur}
                          begin="0.6s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          values="18;32;44"
                          dur={solarFlowDur}
                          begin="0.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </>
                  )}
                </g>

                {/* 3D String Inverter & Step-Up Transformer Unit */}
                <g transform="translate(226, 74)">
                  {/* Top 3D Face */}
                  <polygon
                    points="0,6 8,0 44,0 36,6"
                    fill="#334155"
                    stroke="#64748B"
                    strokeWidth="0.8"
                  />
                  {/* Right 3D Face */}
                  <polygon
                    points="36,6 44,0 44,34 36,40"
                    fill="#0F172A"
                    stroke="#475569"
                    strokeWidth="0.8"
                  />
                  {/* Front Cabinet Face */}
                  <rect
                    x="0"
                    y="6"
                    width="36"
                    height="34"
                    rx="2"
                    fill="#1E293B"
                    stroke="#10B981"
                    strokeOpacity="0.65"
                    strokeWidth="1"
                  />
                  {/* Inverter Status LED & Louvers */}
                  <circle
                    cx="8"
                    cy="14"
                    r="2.5"
                    fill="#10B981"
                    className={!reducedMotion ? 'ga-breathing-led' : ''}
                  />
                  <line
                    x1="15"
                    y1="14"
                    x2="30"
                    y2="14"
                    stroke="#94A3B8"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="6"
                    y1="22"
                    x2="30"
                    y2="22"
                    stroke="#475569"
                    strokeWidth="1.2"
                  />
                  <line
                    x1="6"
                    y1="27"
                    x2="30"
                    y2="27"
                    stroke="#475569"
                    strokeWidth="1.2"
                  />
                  <text
                    x="18"
                    y="36"
                    textAnchor="middle"
                    fill="#A7F3D0"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    INV-01
                  </text>
                </g>

                {/* Top Label & Bottom Telemetry Strip inside Solar Pad (aligned x=16 y=22) */}
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  SOLAR FARM · PV ARRAY
                </text>
                <rect
                  x="12"
                  y="128"
                  width="268"
                  height="24"
                  rx="5"
                  fill="#091323"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y="144"
                  fill="#FDE047"
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ☀ {Math.round(solarMw)} MW PV
                </text>
                <text
                  x="270"
                  y="144"
                  textAnchor="end"
                  fill="#34D399"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {renewable.toFixed(1)}% Renewable
                </text>
              </g>

              {/* =============================================================
                  ZONE 1B (TOP-RIGHT): MINIATURE 3D WIND FARM
              ============================================================= */}
              <g
                transform="translate(612, 14)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('wind')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Isometric Terrain Platform Base */}
                <rect
                  x="0"
                  y="0"
                  width="292"
                  height="162"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter="url(#softDropShadow)"
                  stroke={
                    hoveredNode === 'wind' || windMw >= 600
                      ? '#38BDF8'
                      : '#1E293B'
                  }
                  strokeWidth={
                    hoveredNode === 'wind' || windMw >= 600 ? '1.8' : '1.2'
                  }
                />
                <path
                  d="M 4 162 L 288 162 L 284 166 L 8 166 Z"
                  fill="#0369A1"
                  opacity="0.65"
                />

                {/* Top Header */}
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  WIND FARM · TURBINE ARRAY
                </text>

                {/* Subtle Animated Wind Streamlines Across the Field */}
                <g
                  fill="none"
                  stroke="#38BDF8"
                  strokeOpacity="0.28"
                  strokeWidth="1.2"
                  strokeDasharray="16 24"
                >
                  <path d="M 18 52 Q 110 44, 270 54">
                    {!reducedMotion && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="40"
                        to="0"
                        dur={windFlowDur}
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  <path d="M 32 82 Q 150 74, 276 84">
                    {!reducedMotion && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="40"
                        to="0"
                        dur={windFlowDur}
                        begin="0.5s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                </g>

                {/* Wind Collector Transformer Box (Left edge of Wind Pad) */}
                <g transform="translate(20, 76)">
                  <polygon
                    points="0,6 7,0 39,0 32,6"
                    fill="#334155"
                    stroke="#64748B"
                    strokeWidth="0.8"
                  />
                  <rect
                    x="0"
                    y="6"
                    width="32"
                    height="32"
                    rx="2"
                    fill="#1E293B"
                    stroke="#38BDF8"
                    strokeOpacity="0.7"
                  />
                  <circle
                    cx="8"
                    cy="14"
                    r="2.2"
                    fill="#38BDF8"
                    className={!reducedMotion ? 'ga-breathing-led' : ''}
                  />
                  <line
                    x1="6"
                    y1="22"
                    x2="26"
                    y2="22"
                    stroke="#475569"
                    strokeWidth="1.2"
                  />
                  <text
                    x="16"
                    y="33"
                    textAnchor="middle"
                    fill="#BAE6FD"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    W-SUB
                  </text>
                </g>

                {/* Underground Collector Cable Connecting Turbines -> W-SUB */}
                <path
                  d="M 236 112 L 164 106 L 102 112 L 52 96"
                  fill="none"
                  stroke="#38BDF8"
                  strokeOpacity="0.45"
                  strokeWidth="1.6"
                  strokeDasharray="3 3"
                />

                {/* 3 Three-Dimensional Wind Turbines with Rotating Blades */}
                {[
                  { cx: 102, baseY: 114, hubY: 62, scale: 0.92, delay: '0s' },
                  { cx: 168, baseY: 108, hubY: 50, scale: 1.04, delay: '-0.8s' },
                  { cx: 236, baseY: 114, hubY: 60, scale: 0.95, delay: '-1.5s' },
                ].map((t, idx) => (
                  <g key={`turbine-${idx}`}>
                    {/* Ground Foundation Pad & Shadow */}
                    <ellipse
                      cx={t.cx}
                      cy={t.baseY}
                      rx={12 * t.scale}
                      ry={4 * t.scale}
                      fill="#020617"
                      opacity="0.7"
                    />
                    <ellipse
                      cx={t.cx}
                      cy={t.baseY}
                      rx={7 * t.scale}
                      ry={2.5 * t.scale}
                      fill="#334155"
                      stroke="#64748B"
                      strokeWidth="0.7"
                    />
                    {/* Tapered 3D Cylindrical Tower */}
                    <polygon
                      points={`${t.cx - 3.2 * t.scale},${t.baseY} ${
                        t.cx - 1.3 * t.scale
                      },${t.hubY} ${t.cx + 1.3 * t.scale},${t.hubY} ${
                        t.cx + 3.2 * t.scale
                      },${t.baseY}`}
                      fill="url(#turbineTowerGrad)"
                    />
                    {/* 3D Nacelle Housing */}
                    <rect
                      x={t.cx - 4 * t.scale}
                      y={t.hubY - 2.8 * t.scale}
                      width={9.5 * t.scale}
                      height={5.2 * t.scale}
                      rx="2"
                      fill="#E2E8F0"
                      stroke="#475569"
                      strokeWidth="0.7"
                    />
                    {/* Rotating 3-Blade Rotor Assembly */}
                    <g transform={`translate(${t.cx}, ${t.hubY})`}>
                      <g>
                        {!reducedMotion && windMw > 0 && (
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 0 0"
                            to="360 0 0"
                            dur={windRotorDur}
                            begin={t.delay}
                            repeatCount="indefinite"
                          />
                        )}
                        {[0, 120, 240].map((angle) => (
                          <g
                            key={`blade-${angle}`}
                            transform={`rotate(${angle})`}
                          >
                            <path
                              d={`M -1.1 0 L -2.2 ${
                                -16 * t.scale
                              } L 0 ${-27 * t.scale} L 1.4 ${
                                -14 * t.scale
                              } Z`}
                              fill="#F8FAFC"
                              stroke="#38BDF8"
                              strokeOpacity="0.6"
                              strokeWidth="0.5"
                            />
                          </g>
                        ))}
                      </g>
                      {/* Rotor Hub Nose Cone */}
                      <circle
                        cx="0"
                        cy="0"
                        r={2.6 * t.scale}
                        fill="#38BDF8"
                        stroke="#0F172A"
                        strokeWidth="0.8"
                      />
                    </g>
                  </g>
                ))}

                {/* Wind Energy Particles Flowing from Turbines to Collector */}
                {!reducedMotion && windMw > 0 && (
                  <circle
                    cx="236"
                    cy="112"
                    r="2.2"
                    fill="#38BDF8"
                    filter="url(#particleGlow)"
                  >
                    <animate
                      attributeName="cx"
                      values="236;168;102;52"
                      dur={windFlowDur}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="cy"
                      values="112;108;112;96"
                      dur={windFlowDur}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Bottom Telemetry Strip inside Wind Pad */}
                <rect
                  x="12"
                  y="128"
                  width="268"
                  height="24"
                  rx="5"
                  fill="#091323"
                  stroke="#1E293B"
                  strokeWidth="1"
                />
                <text
                  x="22"
                  y="144"
                  fill="#38BDF8"
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ≋ {Math.round(windMw)} MW WIND
                </text>
                <text
                  x="270"
                  y="144"
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10.5"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {grid.weather_condition}
                </text>
              </g>

              {/* =============================================================
                  TRANSMISSION CONDUITS: SOLAR & WIND -> GRID SUBSTATION
              ============================================================= */}
              {/* Left Conduit: Solar Farm -> Grid Substation */}
              <g>
                <path
                  d="M 252 108 L 340 108"
                  fill="none"
                  stroke="#10B981"
                  strokeOpacity="0.22"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M 252 108 L 340 108"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeDasharray="5 5"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="20"
                      to="0"
                      dur={solarFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                {!reducedMotion && solarMw > 0 && (
                  <>
                    <circle
                      r="3.4"
                      fill="#FDE047"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={solarFlowDur}
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-solar-to-grid" />
                      </animateMotion>
                    </circle>
                    <circle
                      r="2.8"
                      fill="#10B981"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={solarFlowDur}
                        begin="0.65s"
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-solar-to-grid" />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>

              {/* Right Conduit: Wind Farm -> Grid Substation */}
              <g>
                <path
                  d="M 668 108 L 580 108"
                  fill="none"
                  stroke="#38BDF8"
                  strokeOpacity="0.22"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M 668 108 L 580 108"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="2.2"
                  strokeDasharray="5 5"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="20"
                      to="0"
                      dur={windFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                {!reducedMotion && windMw > 0 && (
                  <>
                    <circle
                      r="3.4"
                      fill="#38BDF8"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion dur={windFlowDur} repeatCount="indefinite">
                        <mpath href="#path-wind-to-grid" />
                      </animateMotion>
                    </circle>
                    <circle
                      r="2.8"
                      fill="#10B981"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={windFlowDur}
                        begin="0.7s"
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-wind-to-grid" />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>

              {/* =============================================================
                  ZONE 2 (CENTER-TOP): HIGH-VOLTAGE ELECTRICITY GRID SUBSTATION
              ============================================================= */}
              <g
                transform="translate(340, 14)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('grid')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Substation Isometric Yard Pad */}
                <rect
                  x="0"
                  y="0"
                  width="240"
                  height="162"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter="url(#softDropShadow)"
                  stroke={gridStateColor}
                  strokeWidth={hoveredNode === 'grid' ? '2.4' : '1.7'}
                />
                {/* Substation Carbon State Under-Glow */}
                <ellipse
                  cx="120"
                  cy="92"
                  rx="92"
                  ry="34"
                  fill={gridStateColor}
                  fillOpacity="0.14"
                />

                {/* Top Header & Carbon Status Pill */}
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  ENERGY GRID
                </text>
                <text
                  x="224"
                  y="22"
                  textAnchor="end"
                  fill={gridStateColor}
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ● {gridStateText}
                </text>

                {/* 3D Substation Infrastructure: Gantry Towers, Busbars & Twin Transformers */}
                <g transform="translate(18, 34)">
                  {/* West & East High-Voltage Pylon Gantries */}
                  <polygon
                    points="6,64 12,18 18,18 24,64"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.4"
                  />
                  <line
                    x1="4"
                    y1="28"
                    x2="26"
                    y2="28"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points="180,64 186,18 192,18 198,64"
                    fill="none"
                    stroke="#64748B"
                    strokeWidth="1.4"
                  />
                  <line
                    x1="178"
                    y1="28"
                    x2="200"
                    y2="28"
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                  />

                  {/* Overhead Energized HV Busbar */}
                  <line
                    x1="15"
                    y1="28"
                    x2="189"
                    y2="28"
                    stroke={gridStateColor}
                    strokeWidth="2.2"
                    strokeOpacity="0.85"
                  />

                  {/* Twin 3D Step-Down Power Transformers (TR-A & TR-B) */}
                  {[44, 114].map((tx, idx) => (
                    <g key={`tr-${idx}`} transform={`translate(${tx}, 24)`}>
                      {/* 3D Top Face */}
                      <polygon
                        points="0,6 8,0 46,0 38,6"
                        fill="#334155"
                        stroke="#64748B"
                        strokeWidth="0.8"
                      />
                      {/* 3D Right Side Face */}
                      <polygon
                        points="38,6 46,0 46,34 38,40"
                        fill="#0F172A"
                        stroke="#475569"
                        strokeWidth="0.8"
                      />
                      {/* Transformer Main Tank */}
                      <rect
                        x="0"
                        y="6"
                        width="38"
                        height="34"
                        rx="2"
                        fill="#1E293B"
                        stroke={gridStateColor}
                        strokeOpacity="0.8"
                        strokeWidth="1.2"
                      />
                      {/* Ceramic HV Bushings on Top */}
                      <line
                        x1="10"
                        y1="-6"
                        x2="10"
                        y2="4"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                      />
                      <line
                        x1="20"
                        y1="-6"
                        x2="20"
                        y2="4"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                      />
                      <line
                        x1="30"
                        y1="-6"
                        x2="30"
                        y2="4"
                        stroke="#E2E8F0"
                        strokeWidth="2"
                      />
                      {/* Radiator Cooling Fins & Core Status */}
                      {[8, 14, 20, 26, 32].map((fx) => (
                        <line
                          key={fx}
                          x1={fx}
                          y1="12"
                          x2={fx}
                          y2="34"
                          stroke="#475569"
                          strokeWidth="1.4"
                        />
                      ))}
                      <circle
                        cx="19"
                        cy="23"
                        r="4"
                        fill={gridStateColor}
                        className={!reducedMotion ? 'ga-breathing-led' : ''}
                      />
                    </g>
                  ))}
                </g>

                {/* Prominent Carbon Intensity & Price Telemetry Deck (Bounded inside width=216) */}
                <rect
                  x="12"
                  y="106"
                  width="216"
                  height="46"
                  rx="6"
                  fill="#060D1A"
                  stroke={gridStateColor}
                  strokeOpacity="0.55"
                  strokeWidth="1.2"
                />
                <text
                  x="20"
                  y="127"
                  fill="#F8FAFC"
                  fontSize="15.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {Math.round(carbon)} gCO₂/kWh
                </text>
                <text
                  x="220"
                  y="127"
                  textAnchor="end"
                  fill={gridStateColor}
                  fontSize="10.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ${grid.electricity_price_usd_kwh.toFixed(3)}/kWh
                </text>
                <text
                  x="20"
                  y="144"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  Demand: {Math.round(grid.demand_mw)} MW
                </text>
                <text
                  x="220"
                  y="144"
                  textAnchor="end"
                  fill="#34D399"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  RE: {Math.round(renewable)}%
                </text>
              </g>

              {/* =============================================================
                  DUAL HIGH-VOLTAGE FEEDERS: GRID SUBSTATION -> DATA CENTER
              ============================================================= */}
              <g>
                <line
                  x1="434"
                  y1="176"
                  x2="434"
                  y2="206"
                  stroke={gridStateColor}
                  strokeOpacity="0.25"
                  strokeWidth="6"
                />
                <line
                  x1="486"
                  y1="176"
                  x2="486"
                  y2="206"
                  stroke={gridStateColor}
                  strokeOpacity="0.25"
                  strokeWidth="6"
                />
                <line
                  x1="434"
                  y1="176"
                  x2="434"
                  y2="206"
                  stroke={gridStateColor}
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="16"
                      to="0"
                      dur={gridFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                <line
                  x1="486"
                  y1="176"
                  x2="486"
                  y2="206"
                  stroke={gridStateColor}
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="16"
                      to="0"
                      dur={gridFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                {!reducedMotion && (
                  <>
                    <circle
                      r="3.2"
                      fill={gridStateColor}
                      filter="url(#particleGlow)"
                    >
                      <animateMotion dur={gridFlowDur} repeatCount="indefinite">
                        <mpath href="#path-grid-dc-left" />
                      </animateMotion>
                    </circle>
                    <circle
                      r="3.2"
                      fill={gridStateColor}
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={gridFlowDur}
                        begin="0.55s"
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-grid-dc-right" />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>

              {/* =============================================================
                  ZONE 3 (CENTER): 3D CUTAWAY DATA CENTER FACILITY (N-01..N-12)
              ============================================================= */}
              <g
                transform="translate(234, 204)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('datacenter')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* 3D Facility Cutaway Shell & Dark Reflective Floor */}
                <rect
                  x="0"
                  y="0"
                  width="452"
                  height="164"
                  rx="10"
                  fill="url(#dcFloorGrad)"
                  filter={
                    highlightWorkloadPath ||
                    hoveredNode === 'datacenter' ||
                    isExecutingAtCurrentHour
                      ? 'url(#limeGlow)'
                      : 'url(#softDropShadow)'
                  }
                  stroke={
                    hourPulse ||
                    highlightWorkloadPath ||
                    hoveredNode === 'datacenter' ||
                    isExecutingAtCurrentHour
                      ? '#10B981'
                      : '#38BDF8'
                  }
                  strokeOpacity={
                    hourPulse ||
                    highlightWorkloadPath ||
                    hoveredNode === 'datacenter' ||
                    isExecutingAtCurrentHour
                      ? '0.95'
                      : '0.55'
                  }
                  strokeWidth={
                    hourPulse || highlightWorkloadPath || hoveredNode === 'datacenter'
                      ? '2.2'
                      : '1.5'
                  }
                />

                {/* Cutaway Isometric Glass Wall Bevel Highlight */}
                <path
                  d="M 10 2 L 442 2"
                  stroke="#BAE6FD"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />

                {/* Reflective Raised-Floor Grid Perspective */}
                <g stroke="#1E293B" strokeWidth="0.8" opacity="0.65">
                  <line x1="12" y1="88" x2="440" y2="88" />
                  <line x1="12" y1="150" x2="440" y2="150" />
                </g>

                {/* Facility Header Bar (Aligned y=22 across all middle row cards) */}
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="0.9"
                >
                  DATA CENTER · {isExecutingAtCurrentHour ? 'CLEAN BOOST' : 'COOLING NOMINAL'}
                </text>
                <text
                  x="436"
                  y="22"
                  textAnchor="end"
                  fill="#F8FAFC"
                  fontSize="10.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  Power {workload.energy_kwh} kWh · Load {dynamicClusterLoadPct}%
                </text>

                {/* Subtle Cold-Aisle Cooling Airflow Streamlines */}
                {!reducedMotion && (
                  <g
                    fill="none"
                    stroke="#38BDF8"
                    strokeOpacity="0.26"
                    strokeWidth="1.2"
                    strokeDasharray="8 14"
                  >
                    <path d="M 16 58 L 436 58">
                      <animate
                        attributeName="stroke-dashoffset"
                        from="44"
                        to="0"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path d="M 436 122 L 16 122">
                      <animate
                        attributeName="stroke-dashoffset"
                        from="44"
                        to="0"
                        dur="2.4s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                )}

                {/* 12 Three-Dimensional Server Racks (2 Aisles x 6 Racks: N-01 to N-12) */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const row = Math.floor(idx / 6);
                  const col = idx % 6;
                  const rx = 24 + col * 70;
                  const ry = 30 + row * 64;
                  const isNodeActive = idx < activeNodesCount;
                  const rackAccent = isNodeActive
                    ? isCleanCarbon
                      ? '#10B981'
                      : '#38BDF8'
                    : '#334155';

                  return (
                    <g key={`rack-${idx}`} transform={`translate(${rx}, ${ry})`}>
                      {/* Ambient Floor Reflection Under Active Rack */}
                      {isNodeActive && (
                        <ellipse
                          cx="25"
                          cy="54"
                          rx="24"
                          ry="4"
                          fill={rackAccent}
                          fillOpacity="0.22"
                        />
                      )}

                      {/* 3D Rack Top Bevel */}
                      <polygon
                        points="0,5 7,0 55,0 48,5"
                        fill={isNodeActive ? '#1E293B' : '#0F172A'}
                        stroke={rackAccent}
                        strokeOpacity={isNodeActive ? '0.85' : '0.45'}
                        strokeWidth="0.9"
                      />
                      {/* 3D Rack Right Side Depth Panel */}
                      <polygon
                        points="48,5 55,0 55,47 48,52"
                        fill="#09101D"
                        stroke={rackAccent}
                        strokeOpacity={isNodeActive ? '0.65' : '0.35'}
                        strokeWidth="0.9"
                      />
                      {/* 3D Rack Front Cabinet Door */}
                      <rect
                        x="0"
                        y="5"
                        width="48"
                        height="47"
                        rx="2"
                        fill={isNodeActive ? '#0F1E36' : '#0B1322'}
                        stroke={rackAccent}
                        strokeWidth={isNodeActive ? '1.3' : '0.9'}
                      />

                      {/* 4 Server / GPU Blade Units Inside Each Rack */}
                      {[0, 1, 2, 3].map((blade) => {
                        const by = 9 + blade * 7;
                        return (
                          <g key={blade}>
                            <rect
                              x="4"
                              y={by}
                              width="40"
                              height="5"
                              rx="1"
                              fill={isNodeActive ? '#162A4A' : '#111827'}
                            />
                            {/* Blade Status Micro-LED */}
                            <circle
                              cx="8"
                              cy={by + 2.5}
                              r="1.3"
                              fill={
                                isNodeActive
                                  ? blade % 2 === 0
                                    ? rackAccent
                                    : '#A7F3D0'
                                  : '#475569'
                              }
                              className={
                                isNodeActive && !reducedMotion
                                  ? 'ga-breathing-led'
                                  : ''
                              }
                            />
                            {/* GPU Bus Activity Bar */}
                            <line
                              x1="13"
                              y1={by + 2.5}
                              x2={isNodeActive ? '40' : '26'}
                              y2={by + 2.5}
                              stroke={isNodeActive ? rackAccent : '#334155'}
                              strokeOpacity={isNodeActive ? '0.75' : '0.4'}
                              strokeWidth="1.2"
                            />
                          </g>
                        );
                      })}

                      {/* Travelling Compute Light Bar When Workload Is Running */}
                      {isNodeActive &&
                        isExecutingAtCurrentHour &&
                        !reducedMotion && (
                          <rect
                            x="3"
                            y="9"
                            width="42"
                            height="3"
                            fill={rackAccent}
                            opacity="0.45"
                          >
                            <animate
                              attributeName="y"
                              values="9;30;9"
                              dur="2.2s"
                              begin={`${(idx % 4) * 0.35}s`}
                              repeatCount="indefinite"
                            />
                          </rect>
                        )}

                      {/* Rack Identifier Plate (N-01 .. N-12) */}
                      <text
                        x="24"
                        y="47"
                        textAnchor="middle"
                        fill={isNodeActive ? '#F8FAFC' : '#64748B'}
                        fontSize="8.5"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        N-{String(idx + 1).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* =============================================================
                  COMPUTE UPLINK: DATA CENTER <-> WORKLOAD EXECUTION DOCK
              ============================================================= */}
              <g>
                <line
                  x1="442"
                  y1="368"
                  x2="442"
                  y2="388"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                  strokeOpacity="0.3"
                  strokeWidth="5"
                />
                <line
                  x1="478"
                  y1="368"
                  x2="478"
                  y2="388"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                  strokeOpacity="0.3"
                  strokeWidth="5"
                />
                <line
                  x1="442"
                  y1="368"
                  x2="442"
                  y2="388"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                <line
                  x1="478"
                  y1="368"
                  x2="478"
                  y2="388"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                {!reducedMotion && (
                  <>
                    <circle
                      r="2.8"
                      fill={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={isExecutingAtCurrentHour ? '0.9s' : '1.9s'}
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-dc-workload-left" />
                      </animateMotion>
                    </circle>
                    <circle
                      r="2.8"
                      fill={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={isExecutingAtCurrentHour ? '0.9s' : '1.9s'}
                        begin="0.45s"
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-dc-workload-right" />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>

              {/* =============================================================
                  ZONE 4 (BOTTOM): AI WORKLOAD EXECUTION DOCK & TEMPORAL SHIFT
              ============================================================= */}
              <g
                transform="translate(234, 388)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('workload')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="452"
                  height="72"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? 'url(#limeGlow)'
                      : 'url(#softDropShadow)'
                  }
                  stroke={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#F59E0B'
                      : '#38BDF8'
                  }
                  strokeWidth={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? '2'
                      : '1.5'
                  }
                />

                {/* LEFT BAY: Original Submission Window (BEFORE) */}
                <rect
                  x="10"
                  y="10"
                  width="136"
                  height="52"
                  rx="6"
                  fill="#070E1B"
                  stroke={
                    workload.decision === 'DEFER' ? '#EF444466' : '#38BDF866'
                  }
                  strokeDasharray={
                    workload.decision === 'DEFER' ? '3 3' : undefined
                  }
                />
                {/* Ghost 3D Workload Cube at Origin Slot */}
                <g transform="translate(20, 22)" opacity="0.65">
                  <polygon
                    points="0,6 8,0 20,6 12,12"
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="1"
                  />
                  <polygon
                    points="0,6 12,12 12,24 0,18"
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="1"
                  />
                  <polygon
                    points="12,12 20,6 20,18 12,24"
                    fill="none"
                    stroke="#F87171"
                    strokeWidth="1"
                  />
                </g>
                <text
                  x="46"
                  y="27"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  ORIGIN · {submitTimeStr}
                </text>
                <text
                  x="46"
                  y="41"
                  fill="#FCA5A5"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {baselineCarbonIntensity} gCO₂/kWh
                </text>
                <text
                  x="46"
                  y="54"
                  fill="#64748B"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {workload.decision === 'DEFER'
                    ? 'SHIFTED BY AI'
                    : 'DIRECT SLOT'}
                </text>

                {/* CENTER TRAJECTORY BRIDGE: Animated Workload Shift Path */}
                <g transform="translate(150, 12)">
                  <path
                    d="M 4 28 C 28 10, 56 10, 80 28"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  >
                    {!reducedMotion && (
                      <animate
                        attributeName="stroke-dashoffset"
                        from="16"
                        to="0"
                        dur="1.4s"
                        repeatCount="indefinite"
                      />
                    )}
                  </path>
                  <text
                    x="42"
                    y="12"
                    textAnchor="middle"
                    fill="#34D399"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {workload.decision === 'DEFER'
                      ? `${submitTimeStr} → ${recStartStr}`
                      : 'ACTIVE SLOT'}
                  </text>
                  <text
                    x="42"
                    y="44"
                    textAnchor="middle"
                    fill="#10B981"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    -{workload.carbon_reduction_pct.toFixed(1)}% CO₂
                  </text>
                </g>

                {/* RIGHT BAY: Target Clean Execution Dock + 3D Luminous Workload Token */}
                <rect
                  x="236"
                  y="8"
                  width="206"
                  height="56"
                  rx="7"
                  fill="#061220"
                  stroke={
                    isExecutingAtCurrentHour
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#F59E0B'
                      : '#38BDF8'
                  }
                  strokeWidth="1.4"
                />

                {/* 3D Luminous Isometric Workload Cube Token */}
                <g transform="translate(248, 20)">
                  <circle
                    cx="12"
                    cy="14"
                    r="15"
                    fill={isExecutingAtCurrentHour ? '#10B981' : '#38BDF8'}
                    fillOpacity="0.18"
                    className={!reducedMotion ? 'ga-breathing-led' : ''}
                  />
                  {/* Cube Top Face */}
                  <polygon
                    points="2,8 12,1 22,8 12,15"
                    fill="#34D399"
                    stroke="#A7F3D0"
                    strokeWidth="0.9"
                  />
                  {/* Cube Left Face */}
                  <polygon
                    points="2,8 12,15 12,28 2,21"
                    fill="#059669"
                    stroke="#34D399"
                    strokeWidth="0.9"
                  />
                  {/* Cube Right Face */}
                  <polygon
                    points="12,15 22,8 22,21 12,28"
                    fill="#047857"
                    stroke="#10B981"
                    strokeWidth="0.9"
                  />
                </g>

                {/* Workload Identity & Status Badge (Strictly Non-Overlapping) */}
                <text
                  x="280"
                  y="23"
                  fill="#94A3B8"
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="700"
                >
                  {workload.job_id.toUpperCase()} · {recStartStr}
                </text>
                <text
                  x="280"
                  y="37"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {cleanWorkloadName}
                </text>
                <text
                  x="280"
                  y="53"
                  fill={
                    isExecutingAtCurrentHour
                      ? '#34D399'
                      : isCompletedAtCurrentHour
                      ? '#38BDF8'
                      : isDeferredWaiting
                      ? '#FBBF24'
                      : '#38BDF8'
                  }
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {isExecutingAtCurrentHour
                    ? `● RUNNING AT ${grid.current_time}`
                    : isCompletedAtCurrentHour
                    ? `✓ COMPLETED (< ${deadlineStr})`
                    : isDeferredWaiting
                    ? `⏳ DEFERRED → ${recStartStr}`
                    : `★ SCHEDULED ${recStartStr}`}
                </text>
              </g>

              {/* Animated Workload Token Particle Travelling Along Reschedule Bridge */}
              {!reducedMotion && workload.decision === 'DEFER' && (
                <circle
                  r="3.5"
                  fill="#34D399"
                  filter="url(#particleGlow)"
                  pointerEvents="none"
                >
                  <animateMotion dur="2.1s" repeatCount="indefinite">
                    <mpath href="#path-workload-shift" />
                  </animateMotion>
                </circle>
              )}

              {/* =============================================================
                  ZONE 5A (LEFT HUD): AI SCHEDULING & SAFETY GOVERNANCE SHIELD
              ============================================================= */}
              <g
                transform="translate(16, 204)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('reschedule')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="202"
                  height="164"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter={
                    demoStep === 6 ||
                    demoStep === 7 ||
                    hoveredNode === 'reschedule'
                      ? 'url(#limeGlow)'
                      : 'url(#softDropShadow)'
                  }
                  stroke={
                    hourPulse ||
                    demoStep === 6 ||
                    demoStep === 7 ||
                    hoveredNode === 'reschedule'
                      ? '#10B981'
                      : '#1E293B'
                  }
                  strokeWidth={
                    hourPulse ||
                    demoStep === 6 ||
                    demoStep === 7 ||
                    hoveredNode === 'reschedule'
                      ? '2'
                      : '1.3'
                  }
                />
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  RESCHEDULING &amp; SAFETY
                </text>

                {/* Time Shift Pill */}
                <rect
                  x="14"
                  y="32"
                  width="174"
                  height="30"
                  rx="6"
                  fill="#07101E"
                  stroke="#1E293B"
                />
                <text
                  x="101"
                  y="51"
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="12.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {submitTimeStr} ───► {recStartStr}
                </text>

                {/* Carbon Reduction Metric */}
                <text
                  x="16"
                  y="82"
                  fill="#34D399"
                  fontSize="11.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  -{workload.carbon_reduction_pct.toFixed(1)}% Carbon Impact
                </text>
                <text
                  x="16"
                  y="98"
                  fill="#94A3B8"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  Window: {baselineCarbonIntensity} → {optimizedCarbonIntensity}{' '}
                  gCO₂
                </text>

                {/* Safety Governance Shield Badge */}
                <rect
                  x="14"
                  y="110"
                  width="174"
                  height="24"
                  rx="5"
                  fill={
                    governanceState === 'ALLOWED'
                      ? '#064E3B'
                      : governanceState === 'ASK USER'
                      ? '#451A03'
                      : '#450A0A'
                  }
                  stroke={
                    governanceState === 'ALLOWED'
                      ? '#10B981'
                      : governanceState === 'ASK USER'
                      ? '#F59E0B'
                      : '#EF4444'
                  }
                  strokeWidth="1.2"
                />
                <text
                  x="101"
                  y="126"
                  textAnchor="middle"
                  fill={
                    governanceState === 'ALLOWED'
                      ? '#6EE7B7'
                      : governanceState === 'ASK USER'
                      ? '#FCD34D'
                      : '#FCA5A5'
                  }
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {governanceState === 'ALLOWED'
                    ? '🛡 ✓ SAFE TO WAIT'
                    : governanceState === 'ASK USER'
                    ? '🛡 ⚠ APPROVAL REQ'
                    : '🛡 ✕ BLOCKED'}
                </text>

                <text
                  x="16"
                  y="150"
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  SLA: {workload.deadline} · Now {grid.current_time}
                </text>
              </g>

              {/* Animated Governance Link from Left HUD -> Data Center */}
              <path
                d="M 218 286 L 234 286"
                fill="none"
                stroke="#10B981"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
              {!reducedMotion && (
                <circle r="2.8" fill="#10B981" filter="url(#particleGlow)">
                  <animateMotion dur="1.5s" repeatCount="indefinite">
                    <mpath href="#path-reschedule-arc" />
                  </animateMotion>
                </circle>
              )}

              {/* =============================================================
                  ZONE 5B (RIGHT HUD): HONEST BEFORE/AFTER EMISSIONS IMPACT
              ============================================================= */}
              <g transform="translate(702, 204)">
                <rect
                  x="0"
                  y="0"
                  width="202"
                  height="164"
                  rx="10"
                  fill="url(#isoPadGrad)"
                  filter="url(#softDropShadow)"
                  stroke={hourPulse ? '#10B981' : '#1E293B'}
                  strokeWidth={hourPulse ? '1.8' : '1.3'}
                />
                <text
                  x="16"
                  y="22"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                  letterSpacing="1"
                >
                  EMISSIONS IMPACT (MODEL)
                </text>

                {/* BEFORE Bar: Run at Submission Time */}
                <text
                  x="14"
                  y="42"
                  fill="#CBD5E1"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  Before ({submitTimeStr})
                </text>
                <text
                  x="188"
                  y="42"
                  textAnchor="end"
                  fill="#FCA5A5"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {baselineKgCo2.toFixed(1)} kgCO₂
                </text>
                <rect
                  x="14"
                  y="48"
                  width="174"
                  height="9"
                  rx="4"
                  fill="#091323"
                />
                <rect
                  x="14"
                  y="48"
                  width={baselineBarWidth}
                  height="9"
                  rx="4"
                  fill="#EF4444"
                  fillOpacity="0.85"
                />

                {/* AFTER Bar: Run at Recommended Clean Window */}
                <text
                  x="14"
                  y="76"
                  fill="#CBD5E1"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  After ({recStartStr})
                </text>
                <text
                  x="188"
                  y="76"
                  textAnchor="end"
                  fill="#6EE7B7"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {optimizedKgCo2.toFixed(1)} kgCO₂
                </text>
                <rect
                  x="14"
                  y="82"
                  width="174"
                  height="9"
                  rx="4"
                  fill="#091323"
                />
                <rect
                  x="14"
                  y="82"
                  width={optimizedBarWidth}
                  height="9"
                  rx="4"
                  fill="#10B981"
                />

                {/* Net Savings + Live Selected Hour Summary Box */}
                <rect
                  x="14"
                  y="102"
                  width="174"
                  height="50"
                  rx="6"
                  fill="#061220"
                  stroke="#10B98155"
                />
                <text
                  x="20"
                  y="119"
                  fill="#38BDF8"
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  At {grid.current_time}: {selectedHourKgCo2.toFixed(1)} kgCO₂
                </text>
                <text
                  x="20"
                  y="134"
                  fill="#34D399"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  Saved: {savedKgCo2.toFixed(1)} kgCO₂ (-{workload.carbon_reduction_pct.toFixed(0)}%)
                </text>
                <text
                  x="20"
                  y="147"
                  fill="#94A3B8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  Cost: -${workload.estimated_cost_savings_usd.toFixed(2)} ({workload.cost_reduction_pct.toFixed(1)}%)
                </text>
              </g>
            </svg>
          </div>

          {/* Cinematic Judge Mode Scene Banner inside Canvas when active */}
          {activeJudgeScene && (
            <div className="mt-2.5 px-4 py-2.5 bg-white/95 border border-emerald-400 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px]">
                  SCENE {activeJudgeScene.scene} / 10
                </span>
                <div>
                  <div className="font-bold text-[#0d3f3a] text-sm">
                    {activeJudgeScene.title}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {activeJudgeScene.subtitle}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                {submitTimeStr} ───► {recStartStr}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE TIME SIMULATION TIMELINE (SECTION 9 & 24)
      ===================================================================== */}
      <div className="px-4 py-3.5 bg-white relative">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0d3f3a]">
              24-HOUR INTERACTIVE ENERGY TIMELINE
            </span>
            <span className="text-xs text-slate-500">
              Click any hour or drag slider to update Digital Twin immediately
            </span>
          </div>

          {/* Legend Markers: NOW, BEST WINDOW, DEADLINE */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono tabular-nums">
            <span className="inline-flex items-center gap-1.5 text-[#0d3f3a] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.45)]" />
              NOW ({grid.current_time})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#10B981] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
              BEST WINDOW ({recStartStr})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#F59E0B] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              DEADLINE ({deadlineStr})
            </span>
          </div>
        </div>

        {/* Section 24: Signature Visual Moment — Rescheduling Trajectory Bar */}
        {workload.decision === 'DEFER' && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-50/60 via-emerald-50/80 to-emerald-100/60 border border-emerald-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-semibold">
                WORKLOAD RESCHEDULE PATH:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-700 font-semibold">
                {submitTimeStr} (
                {Math.round(workload.current_carbon_intensity ?? 700)} gCO₂)
              </span>
              <span className="text-emerald-600 font-bold">───────►</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-semibold shadow-sm">
                {recStartStr} (
                {Math.round(workload.predicted_carbon_intensity ?? 390)} gCO₂)
              </span>
            </div>
            <span className="text-emerald-700 font-semibold">
              ✓ SLA Deadline ({deadlineStr}) Satisfied · -
              {workload.carbon_reduction_pct.toFixed(1)}% Carbon
            </span>
          </div>
        )}

        {/* Physical Range Slider for smooth scrubbing */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500 w-12">
            00:00
          </span>
          <input
            type="range"
            min={0}
            max={23}
            value={currentHour}
            onChange={(e) => onSelectHour(Number(e.target.value))}
            aria-label="Simulation Time Cursor"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12 text-right">
            23:00
          </span>
        </div>

        {/* Persistent Inspector Bar (never mounts/unmounts on hover — zero layout shift) */}
        {inspectedPoint && (
          <div className="mb-3 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#0d3f3a]/95 backdrop-blur-md text-white shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono pointer-events-none select-none">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/75">
                {hoveredPoint ? 'INSPECTING' : 'ACTIVE HOUR'}
              </span>
              <span className="text-sm font-bold text-emerald-300">
                {inspectedPoint.time_str}
              </span>
              {inspectedPoint.hour === recHour && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  ★ BEST WINDOW
                </span>
              )}
              {inspectedPoint.hour === currentHour && (
                <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-bold text-[10px]">
                  ● CURRENT TIME
                </span>
              )}
              {inspectedPoint.hour === deadlineHour && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                  SLA DEADLINE
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span>
                Carbon:{' '}
                <strong
                  className={
                    inspectedPoint.carbon_intensity_gco2_kwh <= 420
                      ? 'text-emerald-300'
                      : inspectedPoint.carbon_intensity_gco2_kwh >= 550
                      ? 'text-rose-300'
                      : 'text-amber-300'
                  }
                >
                  {Math.round(inspectedPoint.carbon_intensity_gco2_kwh)}{' '}
                  gCO₂/kWh
                </strong>
              </span>
              <span>
                Renewable:{' '}
                <strong className="text-emerald-300">
                  {Math.round(inspectedPoint.renewable_percentage)}%
                </strong>
              </span>
              <span>
                Price:{' '}
                <strong className="text-white">
                  ${inspectedPoint.electricity_price_usd_kwh.toFixed(3)}/kWh
                </strong>
              </span>
              <span className="text-emerald-200/80 text-[11px]">
                {hoveredPoint
                  ? `Click to jump Digital Twin to ${hoveredPoint.time_str}`
                  : 'Hover any hour below to inspect · Click to jump clock'}
              </span>
            </div>
          </div>
        )}

        {/* 24-Hour Engineering Timeline Matrix (Time / Carbon / Renewables / Markers) */}
        <div
          className="overflow-x-auto border border-slate-200 rounded-2xl shadow-inner"
          onMouseLeave={() => setHoveredHour(null)}
        >
          <div className="min-w-[960px]">
            {/* Row 0: Marker Row (NOW / BEST WINDOW / DEADLINE) */}
            <div
              className="grid bg-[#F1F5F9] border-b border-slate-200 text-[9px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-1.5 text-slate-500 border-r border-slate-200">
                MARKER
              </div>
              {forecast24h.map((pt) => {
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isDeadline = pt.hour === deadlineHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`marker-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-1.5 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      isNow
                        ? 'bg-[#3B82F6]/20 text-[#3B82F6] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                        : isDeadline
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold'
                        : isHovered
                        ? 'bg-emerald-100/70 text-emerald-800'
                        : 'text-transparent'
                    }`}
                  >
                    {isNow
                      ? '● NOW'
                      : isBest
                      ? '★ BEST'
                      : isDeadline
                      ? 'SLA'
                      : '·'}
                  </button>
                );
              })}
            </div>

            {/* Row 1: Hour Labels */}
            <div
              className="grid bg-slate-50 border-b border-slate-200 text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                TIME
              </div>
              {forecast24h.map((pt) => {
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`time-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      isNow
                        ? 'bg-[#3B82F6]/15 text-[#0d3f3a] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/15 text-[#10B981] font-bold'
                        : isHovered
                        ? 'bg-emerald-50 text-[#0d3f3a] font-semibold'
                        : 'text-slate-500 hover:text-[#0d3f3a] hover:bg-emerald-50/50'
                    }`}
                  >
                    {String(pt.hour).padStart(2, '0')}:00
                  </button>
                );
              })}
            </div>

            {/* Row 2: Carbon Intensity (gCO2/kWh) */}
            <div
              className="grid bg-white border-b border-slate-200 text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                CARBON
              </div>
              {forecast24h.map((pt) => {
                const c = Math.round(pt.carbon_intensity_gco2_kwh);
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                const colorClass =
                  c <= 420
                    ? 'text-[#10B981]'
                    : c >= 550
                    ? 'text-[#EF4444]'
                    : 'text-[#F59E0B]';
                return (
                  <button
                    key={`carbon-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${colorClass} ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold'
                        : isBest
                        ? 'bg-[#10B981]/15 font-bold'
                        : isHovered
                        ? 'bg-emerald-50 font-bold'
                        : 'hover:bg-emerald-50/50'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Row 3: Renewable Share (%) */}
            <div
              className="grid bg-white text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                RENEW.
              </div>
              {forecast24h.map((pt) => {
                const r = Math.round(pt.renewable_percentage);
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`ren-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      r >= 38 ? 'text-[#10B981]' : 'text-slate-500'
                    } ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold text-[#0d3f3a]'
                        : isBest
                        ? 'bg-[#10B981]/15 font-bold'
                        : isHovered
                        ? 'bg-emerald-50 font-bold'
                        : 'hover:bg-emerald-50/50'
                    }`}
                  >
                    {r}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
