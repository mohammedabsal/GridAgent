import React from 'react';
import {
  ArrowRight,
  Clock,
  DollarSign,
  Globe,
  Leaf,
  Sparkles,
} from 'lucide-react';
import { ComparisonMetrics, WorkloadJob } from '../services/api';

interface BeforeAfterImpactProps {
  selectedWorkload: WorkloadJob;
  comparison: ComparisonMetrics;
}

export const BeforeAfterImpact: React.FC<BeforeAfterImpactProps> = ({
  selectedWorkload,
  comparison,
}) => {
  // Show both the selected workload's before/after AND the total portfolio impact
  const beforeKg = (selectedWorkload.baseline_emissions_gco2 / 1000).toFixed(1);
  const afterKg = (selectedWorkload.optimized_emissions_gco2 / 1000).toFixed(1);
  const beforeTime = selectedWorkload.submitted_at_time || '15:00';
  const afterTime = selectedWorkload.recommended_start_time || beforeTime;

  const totalBeforeKg = (
    comparison.baseline_total_emissions_gco2 / 1000
  ).toFixed(1);
  const totalAfterKg = (
    comparison.optimized_total_emissions_gco2 / 1000
  ).toFixed(1);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Before vs. After Smart Scheduling
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0d3f3a] mt-1">
            THE IMPACT OF SMART SCHEDULING
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Comparing traditional immediate execution vs. GridAgent-AI for{' '}
            <strong>{selectedWorkload.name}</strong>.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
          All Workloads Combined: <strong>{totalBeforeKg} kg</strong> →{' '}
          <strong className="text-emerald-600">{totalAfterKg} kgCO₂</strong> (-
          {comparison.carbon_reduction_percentage}%)
        </div>
      </div>

      {/* BEFORE vs AFTER Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BEFORE */}
        <div className="rounded-2xl border border-rose-500/35 bg-gradient-to-br from-rose-50 via-slate-50 to-slate-50 p-6 space-y-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-600 border border-rose-500/30">
              BEFORE
            </span>
            <h3 className="text-xl font-extrabold text-[#0d3f3a] mt-2">
              Traditional Cloud Scheduling
            </h3>
            <p className="text-xs text-slate-500">&ldquo;Run immediately&rdquo;</p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">🌍 Carbon</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-rose-600 mt-1">
                {beforeKg} kgCO₂
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">💰 Cost</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#0d3f3a] mt-1">
                ${selectedWorkload.baseline_cost_usd.toFixed(2)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">⏱ Execution</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-[#0d3f3a] mt-1">
                {beforeTime}
              </div>
            </div>
          </div>
        </div>

        {/* AFTER */}
        <div className="rounded-2xl border border-emerald-500/45 bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-50 p-6 space-y-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-600 border border-emerald-500/40">
              AFTER
            </span>
            <h3 className="text-xl font-extrabold text-[#0d3f3a] mt-2">
              GridAgent-AI
            </h3>
            <p className="text-xs text-emerald-600">
              &ldquo;Run at the cleanest safe time&rdquo;
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">🌍 Carbon</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 mt-1">
                {afterKg} kgCO₂
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">💰 Cost</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-teal-600 mt-1">
                ${selectedWorkload.optimized_cost_usd.toFixed(2)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="text-xs text-slate-500">⏱ Execution</div>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-600 mt-1">
                {afterTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Big Percentage Summary Banner + Emotional Story Core */}
      <div className="rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-50 via-slate-100 to-teal-50 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Selected Workload Impact
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">
                Carbon ↓ {selectedWorkload.carbon_reduction_pct}%
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-600">
                Cost ↓ {selectedWorkload.cost_reduction_pct}%
              </span>
            </div>
          </div>
        </div>

        <div className="text-center md:text-right">
          <div className="text-base sm:text-lg font-extrabold text-[#0d3f3a]">
            &ldquo;Same workload. Same output. Cleaner electricity.&rdquo;
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Calculated directly from simulated workload energy and hourly grid
            intensity.
          </div>
        </div>
      </div>
    </section>
  );
};

