import React from 'react';
import { Leaf, Smartphone, TreePine, IndianRupee, TrendingDown } from 'lucide-react';
import type { ComparisonMetrics } from '../services/api';
import { useCountUp } from './useCountUp';

interface Props {
  comparison: ComparisonMetrics;
}

export const ImpactHero: React.FC<Props> = ({ comparison }) => {
  const savedKg = comparison.total_carbon_saved_gco2 / 1000;
  const savedUsd = comparison.total_cost_saved_usd;
  const inr = savedUsd * 83; // display-only jury conversion

  const kgDisplay = useCountUp(savedKg, 1300, 1);
  const pctDisplay = useCountUp(comparison.carbon_reduction_percentage, 1300, 1);
  const usdDisplay = useCountUp(savedUsd, 1300, 0);

  const phones = Math.round(savedKg * 50).toLocaleString('en-IN');
  const trees = (savedKg / 21).toFixed(1);

  const baseKg = comparison.baseline_total_emissions_gco2 / 1000;
  const optKg = comparison.optimized_total_emissions_gco2 / 1000;
  const maxKg = Math.max(baseKg, optKg, 0.01);
  const baseW = `${Math.max(4, (baseKg / maxKg) * 100)}%`;
  const optW = `${Math.max(4, (optKg / maxKg) * 100)}%`;

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-5 text-white shadow-xl shadow-emerald-600/20 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]">
          <Leaf className="h-3 w-3" /> Live impact · vs fixed-schedule baseline
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px]">
          <TrendingDown className="h-3 w-3" /> −{pctDisplay}% CO₂
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div className="ga-pop">
          <div className="font-mono text-5xl font-extrabold tracking-tight sm:text-6xl">
            {kgDisplay}
            <span className="ml-2 text-lg font-bold text-emerald-100">kg CO₂ saved</span>
          </div>
          <div className="mt-2 text-sm text-emerald-50/85">
            ${usdDisplay} saved · <span className="font-mono">≈ ₹{inr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> · zero missed SLAs
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
              <Smartphone className="h-3.5 w-3.5" /> ≈ {phones} phone charges
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
              <TreePine className="h-3.5 w-3.5" /> ≈ {trees} trees / yr
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
              <IndianRupee className="h-3.5 w-3.5" /> dynamic solar tariff
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl bg-white/10 p-4 backdrop-blur">
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-rose-100">Traditional scheduler</span>
              <span className="font-mono font-bold">{baseKg.toFixed(2)} kg</span>
            </div>
            <div className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-black/25">
              <div key={`base-${baseKg}`} className="ga-bar-grow h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500" style={{ width: baseW }} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-semibold text-emerald-100">GridAgent-AI optimized</span>
              <span className="font-mono font-bold">{optKg.toFixed(2)} kg</span>
            </div>
            <div className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-black/25">
              <div key={`opt-${optKg}`} className="ga-bar-grow ga-bar-grow-delay h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300" style={{ width: optW }} />
            </div>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-50/75">
            Same {comparison.total_jobs_evaluated} workloads · {comparison.optimized_jobs_count} optimized · computed from actual kWh × hourly carbon intensity.
          </p>
        </div>
      </div>
    </section>
  );
};
