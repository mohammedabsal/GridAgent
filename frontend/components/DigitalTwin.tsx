import React, { useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowRight,
  BatteryCharging,
  Brain,
  Building2,
  CheckCircle2,
  Clock,
  Cpu,
  Fan,
  Flame,
  Leaf,
  Play,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import {
  GridHourlyPoint,
  GridStatus,
  WorkloadJob,
} from '../services/api';

interface DigitalTwinProps {
  gridStatus: GridStatus;
  forecast24h: GridHourlyPoint[];
  workloads: WorkloadJob[];
  selectedWorkload: WorkloadJob;
  simulationStepLabel: string | null;
  busy: boolean;
  onSelectWorkload: (jobId: string) => void;
  onChangeHour: (hour: number) => void;
  onConfigureWorkload: (
    jobId: string,
    changes: {
      duration_minutes?: number;
      deadline?: string;
      priority?: string;
      energy_kwh?: number;
    }
  ) => void;
  onOverrideGrid: (changes: {
    override_current_carbon?: number;
    override_current_solar_mw?: number;
  }) => void;
  onSimulateDecision: () => void;
}

export const DigitalTwin: React.FC<DigitalTwinProps> = ({
  gridStatus,
  forecast24h,
  workloads,
  selectedWorkload,
  simulationStepLabel,
  busy,
  onSelectWorkload,
  onChangeHour,
  onConfigureWorkload,
  onOverrideGrid,
  onSimulateDecision,
}) => {
  const [localCarbon, setLocalCarbon] = useState<number>(
    gridStatus.carbon_intensity_gco2_kwh
  );
  const [localSolar, setLocalSolar] = useState<number>(
    gridStatus.solar_generation_mw
  );

  React.useEffect(() => {
    setLocalCarbon(gridStatus.carbon_intensity_gco2_kwh);
    setLocalSolar(gridStatus.solar_generation_mw);
  }, [
    gridStatus.carbon_intensity_gco2_kwh,
    gridStatus.solar_generation_mw,
    gridStatus.current_hour,
  ]);

  const carbon = gridStatus.carbon_intensity_gco2_kwh;
  const isHighCarbon = carbon >= 550;
  const isLowCarbon = carbon <= 420;

  const recStart =
    selectedWorkload.recommended_start_time ||
    selectedWorkload.submitted_at_time;
  const recStartHour = parseInt(recStart.split(':')[0], 10);
  const durHours = Math.max(
    1,
    Math.ceil(selectedWorkload.duration_minutes / 60)
  );
  const recEndHour = (recStartHour + durHours) % 24;

  // Determine how the selected workload behaves at the current simulation hour
  const curH = gridStatus.current_hour;
  const isAtRecommendedWindow =
    curH >= recStartHour && curH < recStartHour + durHours;

  const isRunningNow =
    selectedWorkload.status === 'RUNNING' ||
    (selectedWorkload.decision === 'DEFER' && isAtRecommendedWindow);
  const isCompletedNow =
    selectedWorkload.status === 'COMPLETED' ||
    (selectedWorkload.decision === 'DEFER' && curH >= recStartHour + durHours);
  const isBlocked = selectedWorkload.status === 'BLOCKED';
  const isWaitingApproval = selectedWorkload.status === 'AWAITING_APPROVAL';

  const progressPct = isCompletedNow
    ? 100
    : isRunningNow
    ? 68
    : isBlocked
    ? 100
    : 15;

  const batteryReservePct = Math.min(
    96,
    Math.max(22, Math.round(gridStatus.renewable_percentage * 1.45))
  );

  const servers = [
    {
      id: 'Server 01',
      role: 'AI GPU Rack',
      active: isRunningNow || isBlocked,
      load: isRunningNow ? '84%' : '18%',
    },
    {
      id: 'Server 02',
      role: 'Compute Node',
      active: isRunningNow || isBlocked,
      load: isRunningNow ? '76%' : '14%',
    },
    {
      id: 'Server 03',
      role: 'Batch Analytics',
      active: isRunningNow,
      load: isRunningNow ? '72%' : '12%',
    },
    {
      id: 'Server 04',
      role: 'Storage & Index',
      active: true,
      load: isRunningNow ? '65%' : '24%',
    },
  ];

  const keyTimelineHours = [0, 6, 10, 13, 15, 17, 18, 20, 23];

  return (
    <section
      id="digital-twin-section"
      className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-5 sm:p-8 shadow-2xl space-y-6"
    >
      {/* Section Header + Live Sync Indicator */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              ● Synchronized · LIVE DIGITAL TWIN
            </span>
            <span className="text-xs font-mono text-slate-500">
              Simulation Time: {gridStatus.current_time}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0d3f3a] mt-2">
            DIGITAL TWIN
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            A live simulation of your cloud workload and the energy grid around
            it.
          </p>
        </div>

        {/* Physical World <-> Digital Twin Bridge Badge */}
        <div className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs">
          <div className="text-slate-600">
            <div className="font-bold text-[#0d3f3a]">Physical World</div>
            <div className="text-[11px] text-slate-500">
              ☀ Solar · ⚡ Grid · 🏢 Data Center
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 font-mono font-bold border border-emerald-500/30">
            ⇅ LIVE SYNC
          </div>
          <div className="text-slate-600">
            <div className="font-bold text-emerald-600">Digital Twin</div>
            <div className="text-[11px] text-slate-500">
              Simulates Carbon, Cost &amp; Best Time
            </div>
          </div>
        </div>
      </div>

      {/* Active Simulation Banner when "Simulate AI Decision" is running */}
      {simulationStepLabel && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border border-emerald-400/50 p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-bold text-[#0d3f3a]">
              {simulationStepLabel}
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-600">
            LIVE SIMULATION ACTIVE
          </span>
        </div>
      )}

      {/* Workload Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
          Inspect Workload in Twin:
        </span>
        {workloads.map((w) => {
          const active = w.job_id === selectedWorkload.job_id;
          return (
            <button
              key={w.job_id}
              onClick={() => onSelectWorkload(w.job_id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 border ${
                active
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-lg shadow-emerald-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span>{w.name.replace(/\s*\([^)]*\)/, '')}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  active
                    ? 'bg-white/20 text-slate-950'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {w.energy_kwh} kWh
              </span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Digital Twin Environment: LEFT/CENTER Infrastructure + RIGHT AI Brain & Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT / CENTER (7 cols): Living Infrastructure Diagram */}
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          {/* Top Row: Renewable Energy Source (Solar + Wind) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50 to-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                    ☀ Solar &amp; Wind Farm
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {gridStatus.renewable_percentage}% Clean
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <span className="text-xl font-extrabold font-mono text-[#0d3f3a]">
                    {gridStatus.solar_generation_mw} MW
                  </span>
                  <span className="text-xs text-slate-500 ml-1">Solar</span>
                </div>
                <div>
                  <span className="text-xl font-extrabold font-mono text-cyan-600">
                    {gridStatus.wind_generation_mw} MW
                  </span>
                  <span className="text-xs text-slate-500 ml-1">Wind</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Weather: {gridStatus.weather_condition}
              </div>
            </div>

            {/* Battery / Clean Storage Node */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-slate-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    🔋 Clean Energy Storage
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-600">
                  {isLowCarbon ? 'Charging' : 'Buffering'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-extrabold font-mono text-[#0d3f3a]">
                  {batteryReservePct}%
                </span>
                <span className="text-xs text-slate-500">
                  Grid Tariff: ${gridStatus.electricity_price_usd_kwh.toFixed(2)}
                  /kWh
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${batteryReservePct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Animated Energy Flow Conduit: Solar/Wind -> Energy Grid */}
          <div className="my-3 flex flex-col items-center justify-center">
            <div className="relative h-8 w-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="absolute inset-x-0 h-4 bg-emerald-400 rounded-full animate-flow-v" />
            </div>
            <div
              className={`w-full max-w-md rounded-2xl px-4 py-3 border flex items-center justify-between transition-all ${
                isHighCarbon
                  ? 'bg-rose-950/35 border-rose-500/50 text-rose-700'
                  : isLowCarbon
                  ? 'bg-emerald-950/35 border-emerald-500/50 text-emerald-700'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap
                  className={`h-5 w-5 ${
                    isHighCarbon
                      ? 'text-rose-600'
                      : isLowCarbon
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                />
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">
                    [ ENERGY GRID · {gridStatus.current_time} ]
                  </div>
                  <div className="text-[11px] opacity-85">
                    {gridStatus.grid_regime}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-extrabold font-mono text-[#0d3f3a]">
                  {carbon} gCO₂/kWh
                </div>
                <div className="text-[11px] font-bold">
                  {isHighCarbon
                    ? '🔴 High Carbon'
                    : isLowCarbon
                    ? '🟢 Cleaner Energy'
                    : '🟡 Moderate Carbon'}
                </div>
              </div>
            </div>
            <div className="relative h-8 w-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`absolute inset-x-0 h-4 rounded-full animate-flow-v ${
                  isHighCarbon
                    ? 'bg-rose-400'
                    : isLowCarbon
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
            </div>
          </div>

          {/* Center / Bottom: CLOUD DATA CENTER Isometric Infrastructure Block */}
          <div className="rounded-2xl border border-cyan-500/35 bg-gradient-to-b from-slate-100 to-slate-50 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-5 w-5 text-cyan-600" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0d3f3a]">
                    CLOUD DATA CENTER
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    4 Compute Racks · Live Power &amp; Thermal Twin
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-cyan-600">
                  ⚡ Power: {selectedWorkload.energy_kwh} kWh
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center gap-1.5">
                  <Fan className="h-3.5 w-3.5 text-cyan-600 animate-spin-slow" />
                  🌡 Cooling: Normal
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-emerald-600">
                  🌱 Renewable: {gridStatus.renewable_percentage}%
                </span>
              </div>
            </div>

            {/* 4 Isometric-Styled Server Racks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {servers.map((srv) => (
                <div
                  key={srv.id}
                  className={`rounded-xl p-3 border transition-all ${
                    srv.active
                      ? 'bg-cyan-950/25 border-cyan-500/40 shadow-md shadow-cyan-600/30'
                      : 'bg-white/70 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#0d3f3a] flex items-center gap-1.5">
                      <Server className="h-3.5 w-3.5 text-cyan-600" />
                      {srv.id}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        srv.active
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{srv.role}</div>
                  {/* Server Blade LED bars */}
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-500"
                        style={{ width: srv.load }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>Load</span>
                      <span className="text-cyan-600">{srv.load}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Workload Status Bar inside Data Center */}
            <div
              className={`rounded-xl p-4 border transition-all ${
                isRunningNow
                  ? 'bg-sky-950/30 border-sky-500/40'
                  : isCompletedNow
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : isBlocked
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : 'bg-indigo-950/30 border-indigo-500/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isRunningNow
                        ? 'bg-sky-400 animate-ping'
                        : isCompletedNow
                        ? 'bg-emerald-400'
                        : isBlocked
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#0d3f3a]">
                    {isCompletedNow
                      ? `✅ WORKLOAD COMPLETED (${selectedWorkload.name})`
                      : isRunningNow
                      ? `🟢 WORKLOAD RUNNING NOW (${selectedWorkload.name})`
                      : isBlocked
                      ? `🔴 PROTECTED SERVICE — ALWAYS ON (${selectedWorkload.name})`
                      : isWaitingApproval
                      ? `🟡 WAITING FOR HUMAN APPROVAL (${selectedWorkload.name})`
                      : `⏳ WORKLOAD QUEUED FOR CLEAN WINDOW AT ${recStart} (${selectedWorkload.name})`}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {progressPct}%
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    isCompletedNow
                      ? 'bg-emerald-400'
                      : isRunningNow
                      ? 'bg-gradient-to-r from-sky-400 to-emerald-400'
                      : isBlocked
                      ? 'bg-rose-400'
                      : 'bg-indigo-400'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
                <span>
                  Duration: <strong>{selectedWorkload.duration_minutes} min</strong> ·
                  Deadline: <strong>{selectedWorkload.deadline}</strong>
                </span>
                <span>
                  Scheduled Window:{' '}
                  <strong className="text-emerald-600">
                    {recStart} – {String(recEndHour).padStart(2, '0')}:00
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT (5 cols): AI Brain + Interactive Simulation Parameter Controls */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-4">
          {/* AI Brain Recommendation Card */}
          <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-slate-100 via-slate-100 to-emerald-50 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    AI Decision Brain
                  </div>
                  <div className="text-sm font-bold text-[#0d3f3a]">
                    Current Recommendation
                  </div>
                </div>
              </div>
              <button
                onClick={onSimulateDecision}
                disabled={busy}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-md shadow-emerald-500/20"
              >
                ⚡ Simulate AI Decision
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="text-xs text-slate-500">
                For <strong>{selectedWorkload.name}</strong>:
              </div>
              <div className="text-2xl font-extrabold text-emerald-600">
                {selectedWorkload.status === 'BLOCKED'
                  ? 'DO NOT DELAY (Protected)'
                  : selectedWorkload.status === 'AWAITING_APPROVAL'
                  ? `WAIT UNTIL ${recStart} (Needs Approval)`
                  : selectedWorkload.decision === 'DEFER'
                  ? `WAIT UNTIL ${recStart}`
                  : `RUN IMMEDIATELY (${recStart})`}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedWorkload.decision_reason}
              </p>
            </div>

            {/* Quick Impact Pills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="text-[11px] text-slate-500">
                  Carbon Reduction
                </div>
                <div className="text-lg font-extrabold font-mono text-emerald-600 mt-0.5">
                  {selectedWorkload.carbon_reduction_pct}%
                </div>
                <div className="text-[11px] text-slate-500">
                  Saves{' '}
                  {(
                    selectedWorkload.estimated_carbon_savings_gco2 / 1000
                  ).toFixed(1)}{' '}
                  kgCO₂
                </div>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200">
                <div className="text-[11px] text-slate-500">Cost Reduction</div>
                <div className="text-lg font-extrabold font-mono text-teal-600 mt-0.5">
                  {selectedWorkload.cost_reduction_pct}%
                </div>
                <div className="text-[11px] text-slate-500">
                  Saves ${selectedWorkload.estimated_cost_savings_usd.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Live Parameter Controls (Section 17) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-cyan-600" />
                <h3 className="text-sm font-bold text-[#0d3f3a]">
                  Interactive Twin Parameters (Try Changing!)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-cyan-600">
                Live Recalculation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* 1. Workload Duration */}
              <div>
                <label className="block text-slate-500 mb-1">
                  Duration
                </label>
                <select
                  aria-label="Workload Duration"
                  value={selectedWorkload.duration_minutes}
                  disabled={busy}
                  onChange={(e) =>
                    onConfigureWorkload(selectedWorkload.job_id, {
                      duration_minutes: Number(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-mono text-[#0d3f3a]"
                >
                  <option value={60}>60 min (1 hr)</option>
                  <option value={120}>120 min (2 hrs)</option>
                  <option value={180}>180 min (3 hrs)</option>
                  <option value={240}>240 min (4 hrs)</option>
                </select>
              </div>

              {/* 2. Workload Deadline */}
              <div>
                <label className="block text-slate-500 mb-1">
                  Deadline
                </label>
                <select
                  aria-label="Workload Deadline"
                  value={selectedWorkload.deadline}
                  disabled={busy}
                  onChange={(e) =>
                    onConfigureWorkload(selectedWorkload.job_id, {
                      deadline: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-mono text-[#0d3f3a]"
                >
                  {[
                    '16:00',
                    '17:00',
                    '18:00',
                    '19:00',
                    '20:00',
                    '21:00',
                    '22:00',
                    '23:00',
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Workload Priority */}
              <div>
                <label className="block text-slate-500 mb-1">
                  Priority
                </label>
                <select
                  aria-label="Workload Priority"
                  value={selectedWorkload.priority}
                  disabled={busy}
                  onChange={(e) =>
                    onConfigureWorkload(selectedWorkload.job_id, {
                      priority: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-mono text-[#0d3f3a]"
                >
                  <option value="LOW">LOW (Flexible)</option>
                  <option value="MEDIUM">MEDIUM (Standard)</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL (Urgent)</option>
                </select>
              </div>
            </div>

            {/* Grid Carbon & Solar Sliders */}
            <div className="space-y-3 pt-1 border-t border-slate-200 text-xs">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>
                    Grid Carbon at {gridStatus.current_time}:{' '}
                    <strong className="font-mono text-[#0d3f3a]">
                      {localCarbon} gCO₂/kWh
                    </strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Drag to test grid spikes
                  </span>
                </div>
                <input
                  type="range"
                  min={180}
                  max={850}
                  step={10}
                  value={localCarbon}
                  onChange={(e) => setLocalCarbon(Number(e.target.value))}
                  onMouseUp={() =>
                    onOverrideGrid({ override_current_carbon: localCarbon })
                  }
                  onTouchEnd={() =>
                    onOverrideGrid({ override_current_carbon: localCarbon })
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>
                    Solar Generation at {gridStatus.current_time}:{' '}
                    <strong className="font-mono text-amber-600">
                      {localSolar} MW
                    </strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Adjust clean energy supply
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6000}
                  step={100}
                  value={localSolar}
                  onChange={(e) => setLocalSolar(Number(e.target.value))}
                  onMouseUp={() =>
                    onOverrideGrid({ override_current_solar_mw: localSolar })
                  }
                  onTouchEnd={() =>
                    onOverrideGrid({ override_current_solar_mw: localSolar })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM: Interactive 24-Hour Digital Twin Timeline Slider (Section 4) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Interactive Simulation Timeline
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#0d3f3a]">
              Drag the time slider to see how the Digital Twin responds across 24
              hours
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-amber-600">
              Now: {gridStatus.current_time}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600">
              Best Window: {recStart}
            </span>
          </div>
        </div>

        <input
          aria-label="24-Hour Simulation Time Slider"
          type="range"
          min={0}
          max={23}
          step={1}
          value={gridStatus.current_hour}
          onChange={(e) => onChangeHour(Number(e.target.value))}
          className="w-full h-2.5 bg-slate-100 rounded-lg accent-emerald-400 cursor-pointer"
        />

        {/* Quick Time Checkpoints */}
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
          {keyTimelineHours.map((h) => {
            const pt = forecast24h[h];
            if (!pt) return null;
            const isCurr = h === gridStatus.current_hour;
            const isBest = pt.time_str === recStart;
            const ptHigh = pt.carbon_intensity_gco2_kwh >= 550;
            const ptClean = pt.carbon_intensity_gco2_kwh <= 420;

            return (
              <button
                key={h}
                onClick={() => onChangeHour(h)}
                className={`p-2 rounded-xl border text-left transition ${
                  isCurr
                    ? 'bg-slate-100 border-amber-400 ring-1 ring-amber-400/50'
                    : isBest
                    ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-950/50'
                    : 'bg-white/70 border-slate-200 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#0d3f3a]">
                  <span>{pt.time_str}</span>
                  <span>
                    {ptHigh ? '🔴' : ptClean ? '🟢' : '🟡'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                  {pt.carbon_intensity_gco2_kwh} gCO₂
                </div>
                <div className="text-[10px] text-emerald-600">
                  🌱 {pt.renewable_percentage}%
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

