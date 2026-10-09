import React from 'react';
import {
  Activity,
  Clock,
  Cpu,
  DollarSign,
  Flame,
  Leaf,
  Play,
  RefreshCw,
  ShieldAlert,
  Sun,
  Wind,
  Zap,
} from 'lucide-react';
import { ComparisonMetrics, GridStatus, WorkloadJob } from '../services/api';

interface TopMetricsBarProps {
  gridStatus: GridStatus;
  workloads: WorkloadJob[];
  comparison: ComparisonMetrics;
  activeProfile: string;
  availableProfiles: string[];
  busy: boolean;
  onStepClock: (hours: number) => void;
  onSetHour: (hour: number) => void;
  onChangeProfile: (profile: string) => void;
  onReset: (seedScenario1: boolean) => void;
  onRunWalkthrough: () => void;
  onOpenSubmitModal: () => void;
}

export const TopMetricsBar: React.FC<TopMetricsBarProps> = ({
  gridStatus,
  workloads,
  comparison,
  activeProfile,
  availableProfiles,
  busy,
  onStepClock,
  onSetHour,
  onChangeProfile,
  onReset,
  onRunWalkthrough,
  onOpenSubmitModal,
}) => {
  const activeCount = workloads.filter((w) => w.status === 'RUNNING').length;
  const queuedOrDeferredCount = workloads.filter((w) =>
    ['QUEUED', 'DEFERRED', 'AWAITING_APPROVAL'].includes(w.status)
  ).length;

  const isHighCarbon = gridStatus.carbon_intensity_gco2_kwh >= 600;
  const isCleanWindow = gridStatus.carbon_intensity_gco2_kwh <= 420;

  const carbonSavedKg = (comparison.total_carbon_saved_gco2 / 1000).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Top Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Zap className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0d3f3a]">
                  GridAgent-AI
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  PERCEIVE → REASON → SAFETY → EXECUTE
                </span>
                {gridStatus.is_simulated ? (
                  <span
                    title="Prototype clearly distinguishes simulated telemetry from real-world grid data"
                    className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/30"
                  >
                    SIMULATION DATA ({activeProfile})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-mono font-medium rounded-full bg-sky-500/15 text-sky-600 border border-sky-500/30">
                    LIVE TELEMETRY
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Carbon-Aware Cloud Workload Orchestrator • Google Antigravity Multi-Agent Runtime &amp; MCP Layer
              </p>
            </div>
          </div>

          {/* Simulation Clock & Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-slate-500">Sim Clock:</span>
              <select
                aria-label="Simulation Hour"
                value={gridStatus.current_hour}
                disabled={busy}
                onChange={(e) => onSetHour(Number(e.target.value))}
                className="bg-transparent text-sm font-mono font-bold text-[#0d3f3a] focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h} className="bg-white text-[#0d3f3a]">
                    {String(h).padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <button
                onClick={() => onStepClock(1)}
                disabled={busy}
                className="ml-1 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-600 transition disabled:opacity-50"
                title="Advance simulation clock by +1 hour and trigger scheduled workload transitions"
              >
                +1h Step
              </button>
            </div>

            <select
              aria-label="Grid Profile"
              value={activeProfile}
              disabled={busy}
              onChange={(e) => onChangeProfile(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none hover:border-slate-300"
            >
              {availableProfiles.map((prof) => (
                <option key={prof} value={prof} className="bg-white">
                  Profile: {prof}
                </option>
              ))}
            </select>

            <button
              onClick={onRunWalkthrough}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
              title="Run the complete 15:00 Submit -> 17:00 Run -> 18:00 Complete lifecycle demo for AI-TRAINING-001"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Judge Walkthrough (15:00→18:00)
            </button>

            <button
              onClick={onOpenSubmitModal}
              disabled={busy}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              + Submit Workload
            </button>

            <button
              onClick={() => onReset(true)}
              disabled={busy}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
              title="Reset simulation clock to 15:00 and seed Scenario 1"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 7 Required Top Section KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* 1. Current Carbon Intensity */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Carbon Intensity</span>
            <Flame
              className={`h-4 w-4 ${
                isHighCarbon
                  ? 'text-rose-600'
                  : isCleanWindow
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-[#0d3f3a]">
              {gridStatus.carbon_intensity_gco2_kwh}
            </span>
            <span className="text-xs text-slate-500">gCO₂/kWh</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 truncate">
            At {gridStatus.current_time} ({gridStatus.weather_condition})
          </div>
        </div>

        {/* 2. Renewable Percentage */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Renewable Share</span>
            <Sun className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">
              {gridStatus.renewable_percentage}%
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span>☀ {gridStatus.solar_generation_mw} MW</span>
            <span>• 💨 {gridStatus.wind_generation_mw} MW</span>
          </div>
        </div>

        {/* 3. Current Grid Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Current Grid Status</span>
            <Wind className="h-4 w-4 text-sky-600" />
          </div>
          <div
            className={`text-xs font-bold px-2 py-1 rounded-md inline-block mt-0.5 ${
              isHighCarbon
                ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30'
                : isCleanWindow
                ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
            }`}
          >
            {gridStatus.grid_status_label}
          </div>
          <div className="text-[11px] text-slate-500 mt-1.5 truncate">
            {gridStatus.grid_regime}
          </div>
        </div>

        {/* 4. Active Workloads */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Active Workloads</span>
            <Cpu className="h-4 w-4 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-[#0d3f3a]">
              {activeCount}
            </span>
            <span className="text-xs text-sky-600">RUNNING</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cluster Load: {gridStatus.cloud_capacity_utilization_pct}%
          </div>
        </div>

        {/* 5. Queued / Deferred Workloads */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Queued / Deferred</span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-[#0d3f3a]">
              {queuedOrDeferredCount}
            </span>
            <span className="text-xs text-indigo-600">
              / {workloads.length} total
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Blocked: {comparison.blocked_jobs_count} • Ask User:{' '}
            {comparison.awaiting_approval_count}
          </div>
        </div>

        {/* 6. Estimated Carbon Saved */}
        <div className="bg-white border border-emerald-500/30 rounded-xl p-3.5 bg-gradient-to-br from-slate-100 to-emerald-50">
          <div className="flex items-center justify-between text-xs text-emerald-600 mb-1">
            <span>Est. Carbon Saved</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-emerald-600">
              {carbonSavedKg}
            </span>
            <span className="text-xs text-emerald-600">kgCO₂</span>
          </div>
          <div className="text-[11px] text-emerald-600/90 mt-1 font-medium">
            ↓ {comparison.carbon_reduction_percentage}% vs Fixed Schedule
          </div>
        </div>

        {/* 7. Estimated Cost Saved */}
        <div className="bg-white border border-teal-500/30 rounded-xl p-3.5 bg-gradient-to-br from-slate-100 to-teal-50">
          <div className="flex items-center justify-between text-xs text-teal-600 mb-1">
            <span>Est. Cost Saved</span>
            <DollarSign className="h-4 w-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold font-mono text-teal-600">
              ${comparison.total_cost_saved_usd.toFixed(2)}
            </span>
          </div>
          <div className="text-[11px] text-teal-600/90 mt-1 font-medium">
            ↓ {comparison.cost_reduction_percentage}% Tariff Optimization
          </div>
        </div>
      </div>
    </div>
  );
};
