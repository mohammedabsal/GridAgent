import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  Info,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';

interface WhatIfSimulationProps {
  workload: WorkloadJob;
  gridStatus: GridStatus;
  forecast24h: GridHourlyPoint[];
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({
  workload,
  gridStatus,
  forecast24h,
}) => {
  const baselineKg = (workload.baseline_emissions_gco2 / 1000).toFixed(1);
  const optimizedKg = (workload.optimized_emissions_gco2 / 1000).toFixed(1);
  const savedKg = (workload.estimated_carbon_savings_gco2 / 1000).toFixed(1);

  const baselineTime = workload.submitted_at_time || '15:00';
  const recTime = workload.recommended_start_time || baselineTime;
  const baselineCarbon =
    workload.current_carbon_intensity ?? gridStatus.carbon_intensity_gco2_kwh;
  const predictedCarbon =
    workload.predicted_carbon_intensity ?? baselineCarbon;

  const hasSavings = workload.carbon_reduction_pct > 0;
  const isBlocked = workload.status === 'BLOCKED';

  // Build candidate windows list (from backend or derived deterministically from forecast24h)
  const candidates =
    workload.candidate_windows && workload.candidate_windows.length > 0
      ? workload.candidate_windows
      : [15, 16, 17, 18, 19].map((h) => {
          const pt = forecast24h[h] || forecast24h[0];
          const durHrs = Math.max(1, Math.ceil(workload.duration_minutes / 60));
          return {
            start_hour: h,
            start_time: `${String(h).padStart(2, '0')}:00`,
            end_hour: (h + durHrs) % 24,
            end_time: `${String((h + durHrs) % 24).padStart(2, '0')}:00`,
            avg_carbon_intensity: pt.carbon_intensity_gco2_kwh,
            avg_solar_mw: pt.solar_generation_mw,
            avg_renewable_pct: pt.renewable_percentage,
            avg_price_usd_kwh: pt.electricity_price_usd_kwh,
            estimated_emissions_gco2:
              pt.carbon_intensity_gco2_kwh * workload.energy_kwh,
            estimated_cost_usd:
              pt.electricity_price_usd_kwh * workload.energy_kwh,
            meets_deadline:
              h + durHrs <= parseInt(workload.deadline.split(':')[0], 10),
          };
        });

  return (
    <section className="rounded-3xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Side-by-Side Scenario Simulation
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            WHAT IF WE RUN THIS WORKLOAD?
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Comparing immediate execution vs. waiting for the cleanest safe
            window for <strong>{workload.name}</strong> ({workload.energy_kwh}{' '}
            kWh).
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            Calculated from simulated workload energy + hourly grid intensity.
          </span>
        </div>
      </div>

      {/* Two Large Comparison Cards + Center Animated Arrow */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 items-center">
        {/* CARD 1: RUN NOW */}
        <div className="lg:col-span-5 rounded-2xl border border-rose-500/40 bg-gradient-to-b from-rose-950/30 via-slate-950 to-slate-950 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              🔴 RUN NOW
            </span>
            <span className="text-xs font-mono text-slate-400">
              Without GridAgent-AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Start Time</div>
              <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                {baselineTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Deadline: {workload.deadline}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Grid Carbon</div>
              <div className="text-2xl font-extrabold font-mono text-rose-300 mt-0.5">
                {baselineCarbon}{' '}
                <span className="text-xs font-normal text-slate-400">
                  gCO₂/kWh
                </span>
              </div>
              <div className="text-[11px] text-rose-300/80 mt-0.5">
                Fossil-heavy grid
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Carbon Emissions</div>
              <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                {baselineKg}{' '}
                <span className="text-xs font-normal text-slate-400">
                  kgCO₂
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {workload.energy_kwh} kWh × {baselineCarbon} gCO₂
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Electricity Cost</div>
              <div className="text-2xl font-extrabold font-mono text-white mt-0.5">
                ${workload.baseline_cost_usd.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Peak demand tariff
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-200 flex items-center justify-between">
            <span>Result: High carbon impact</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
        </div>

        {/* CENTER ANIMATED FLOW BRIDGE */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center py-2">
          <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-1 shadow-lg">
            <div className="text-[10px] font-mono font-bold text-slate-400">
              RUN NOW
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-400 mx-auto animate-pulse" />
            <div className="text-[10px] font-mono font-bold text-emerald-300">
              {hasSavings ? 'WAIT' : 'CHECK'}
            </div>
            <ArrowRight className="h-5 w-5 text-emerald-400 mx-auto animate-pulse" />
            <div className="text-[10px] font-mono font-extrabold text-white">
              {hasSavings ? 'SAVE' : 'SAFE'}
            </div>
          </div>
        </div>

        {/* CARD 2: WAIT FOR CLEANER ENERGY */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-6 space-y-4 shadow-xl ${
            hasSavings
              ? 'border-emerald-500/50 bg-gradient-to-b from-emerald-950/35 via-slate-950 to-slate-950'
              : 'border-amber-500/40 bg-gradient-to-b from-amber-950/25 via-slate-950 to-slate-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${
                hasSavings
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              {hasSavings
                ? '🟢 WAIT FOR CLEANER ENERGY'
                : '🟡 CANNOT SAFELY DELAY'}
            </span>
            <span className="text-xs font-mono text-emerald-300">
              With GridAgent-AI
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Recommended Time</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {recTime}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Before {workload.deadline} deadline
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Expected Grid Carbon</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {predictedCarbon}{' '}
                <span className="text-xs font-normal text-slate-400">
                  gCO₂/kWh
                </span>
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">
                {hasSavings ? 'High wind + solar window' : 'Immediate window'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Carbon Emissions</div>
              <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                {optimizedKg}{' '}
                <span className="text-xs font-normal text-slate-400">
                  kgCO₂
                </span>
              </div>
              <div className="text-[11px] text-emerald-300/80 mt-0.5">
                {hasSavings
                  ? `Saves ${savedKg} kgCO₂`
                  : 'No reduction possible'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="text-xs text-slate-400">Electricity Cost</div>
              <div className="text-2xl font-extrabold font-mono text-teal-400 mt-0.5">
                ${workload.optimized_cost_usd.toFixed(2)}
              </div>
              <div className="text-[11px] text-teal-300/80 mt-0.5">
                {hasSavings
                  ? `Saves $${workload.estimated_cost_savings_usd.toFixed(2)}`
                  : 'Standard tariff'}
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
              hasSavings
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-200'
            }`}
          >
            <span>
              {hasSavings
                ? 'Result: Lower carbon & lower cost impact'
                : isBlocked
                ? 'Result: Protected critical workload cannot be delayed'
                : 'Result: Deadline does not allow safe deferral'}
            </span>
            <Leaf className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Big Savings Callout Banner */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div className="text-center md:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Simulation Outcome
          </div>
          <div className="text-sm text-slate-200 mt-1">
            {hasSavings
              ? `By waiting from ${baselineTime} until ${recTime}, this workload finishes before its ${workload.deadline} deadline while using cleaner energy.`
              : isBlocked
              ? 'AI did not delay this workload because safety rules protect critical production services.'
              : `AI could not reduce emissions because the ${workload.deadline} workload deadline prevents deferral.`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Potential Carbon Reduction
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1">
            {workload.carbon_reduction_pct}%
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            {hasSavings
              ? `${baselineKg} kg → ${optimizedKg} kgCO₂`
              : '0% reduction (Immediate run required)'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-teal-300">
            Potential Cost Reduction
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-400 mt-1">
            {workload.cost_reduction_pct}%
          </div>
          <div className="text-xs text-slate-300 mt-0.5">
            {hasSavings
              ? `$${workload.baseline_cost_usd.toFixed(2)} → $${workload.optimized_cost_usd.toFixed(2)}`
              : '0% reduction'}
          </div>
        </div>
      </div>

      {/* Candidate Execution Windows Evaluated (Section 18) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-400">
            Candidate Execution Windows Evaluated by Digital Twin
          </span>
          <span className="text-slate-400">
            Formula: Energy ({workload.energy_kwh} kWh) × Grid Carbon = Emissions
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {candidates.map((win) => {
            const isBest = win.start_time === recTime && !isBlocked;
            const kg = (win.estimated_emissions_gco2 / 1000).toFixed(1);
            const highC = win.avg_carbon_intensity >= 550;

            return (
              <div
                key={win.start_time}
                className={`p-3 rounded-xl border text-xs transition ${
                  isBest
                    ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/50'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between font-mono font-bold text-white">
                  <span>
                    {win.start_time}–{win.end_time}
                  </span>
                  <span>
                    {isBest ? '✅ Best' : highC ? '❌ High' : '✅ Valid'}
                  </span>
                </div>
                <div className="text-sm font-extrabold font-mono text-emerald-300 mt-1">
                  {kg} kgCO₂
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {win.avg_carbon_intensity} gCO₂/kWh · $
                  {win.estimated_cost_usd.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

