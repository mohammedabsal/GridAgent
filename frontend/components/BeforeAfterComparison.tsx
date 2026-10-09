import React from 'react';
import {
  ArrowDown,
  BarChart3,
  CheckCircle2,
  DollarSign,
  Leaf,
  TrendingDown,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ComparisonMetrics } from '../services/api';

interface BeforeAfterComparisonProps {
  comparison: ComparisonMetrics;
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  comparison,
}) => {
  const baseKg = (comparison.baseline_total_emissions_gco2 / 1000).toFixed(2);
  const optKg = (comparison.optimized_total_emissions_gco2 / 1000).toFixed(2);
  const savedKg = (comparison.total_carbon_saved_gco2 / 1000).toFixed(2);

  const chartData = comparison.job_comparisons.map((jc) => ({
    job_id: jc.job_id,
    'Baseline (Fixed Schedule) kgCO₂': Number(
      (jc.baseline_emissions_gco2 / 1000).toFixed(2)
    ),
    'GridAgent-AI (Optimized) kgCO₂': Number(
      (jc.optimized_emissions_gco2 / 1000).toFixed(2)
    ),
  }));

  return (
    <div className="space-y-5">
      {/* Architecture Pipeline Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traditional Scheduler */}
        <div className="bg-white border border-rose-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 border border-rose-500/30">
              BEFORE: TRADITIONAL STATIC SCHEDULER
            </span>
            <span className="text-xs font-mono text-slate-500">
              Carbon-Blind Execution
            </span>
          </div>

          <div className="flex flex-col items-center py-3 space-y-1.5 text-xs font-mono">
            <div className="w-full max-w-md p-2.5 rounded-xl bg-white border border-slate-200 text-center text-slate-700">
              1. Fixed Schedule (Immediate FIFO Execution at 15:00)
            </div>
            <ArrowDown className="h-4 w-4 text-rose-600" />
            <div className="w-full max-w-md p-2.5 rounded-xl bg-white border border-slate-200 text-center text-slate-700">
              2. Runs During Peak Thermal Grid (700 gCO₂/kWh)
            </div>
            <ArrowDown className="h-4 w-4 text-rose-600" />
            <div className="w-full max-w-md p-2.5 rounded-xl bg-rose-50 border border-rose-500/40 text-center text-rose-700 font-bold">
              3. High Carbon &amp; Peak Tariff Impact: {baseKg} kgCO₂ / $
              {comparison.baseline_total_cost_usd.toFixed(2)}
            </div>
          </div>
        </div>

        {/* GridAgent-AI */}
        <div className="bg-white border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
              AFTER: GRIDAGENT-AI ORCHESTRATOR
            </span>
            <span className="text-xs font-mono text-emerald-600">
              Multi-Agent Carbon-Aware
            </span>
          </div>

          <div className="flex flex-col items-center py-1 space-y-1 text-xs font-mono">
            <div className="w-full max-w-md p-2 rounded-xl bg-white border border-slate-200 text-center text-sky-600">
              1. Grid Perception &amp; 24-Hour Solar/Wind Forecast (MCP)
            </div>
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
            <div className="w-full max-w-md p-2 rounded-xl bg-white border border-slate-200 text-center text-purple-600">
              2. AI Reasoning &amp; Optimal Window Search (17:00 @ 390 gCO₂/kWh)
            </div>
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
            <div className="w-full max-w-md p-2 rounded-xl bg-white border border-slate-200 text-center text-amber-600">
              3. Safety Governance Policy Validation (ALLOW / DENY / ASK_USER)
            </div>
            <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
            <div className="w-full max-w-md p-2 rounded-xl bg-emerald-50 border border-emerald-500/40 text-center text-emerald-600 font-bold">
              4. Reduced Carbon Impact: {optKg} kgCO₂ (-
              {comparison.carbon_reduction_percentage}%) / $
              {comparison.optimized_total_cost_usd.toFixed(2)} (-
              {comparison.cost_reduction_percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* 6 Calculated Comparison Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-xs text-slate-500">Baseline Emissions</div>
          <div className="text-xl font-extrabold font-mono text-rose-600 mt-1">
            {baseKg} kg
          </div>
          <div className="text-[11px] text-slate-500">
            {comparison.baseline_total_emissions_gco2.toLocaleString()} gCO₂
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-xs text-slate-500">Optimized Emissions</div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 mt-1">
            {optKg} kg
          </div>
          <div className="text-[11px] text-slate-500">
            {comparison.optimized_total_emissions_gco2.toLocaleString()} gCO₂
          </div>
        </div>

        <div className="bg-white border border-emerald-500/30 rounded-xl p-3.5">
          <div className="text-xs text-emerald-600 flex items-center gap-1">
            <Leaf className="h-3.5 w-3.5" /> Carbon Reduction %
          </div>
          <div className="text-xl font-extrabold font-mono text-emerald-600 mt-1">
            {comparison.carbon_reduction_percentage}%
          </div>
          <div className="text-[11px] text-emerald-600/80">
            Saved {savedKg} kgCO₂
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-xs text-slate-500">Baseline Est. Cost</div>
          <div className="text-xl font-extrabold font-mono text-rose-600 mt-1">
            ${comparison.baseline_total_cost_usd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Fixed Tariff</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <div className="text-xs text-slate-500">Optimized Est. Cost</div>
          <div className="text-xl font-extrabold font-mono text-teal-600 mt-1">
            ${comparison.optimized_total_cost_usd.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Dynamic Solar Tariff</div>
        </div>

        <div className="bg-white border border-teal-500/30 rounded-xl p-3.5">
          <div className="text-xs text-teal-600 flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> Cost Reduction %
          </div>
          <div className="text-xl font-extrabold font-mono text-teal-600 mt-1">
            {comparison.cost_reduction_percentage}%
          </div>
          <div className="text-[11px] text-teal-600/80">
            Saved ${comparison.total_cost_saved_usd.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bar Chart Comparing Per-Job Emissions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0d3f3a] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              Per-Workload Emissions Comparison (Baseline vs GridAgent-AI)
            </h3>
            <p className="text-xs text-slate-500">
              All values computed deterministically from actual simulated workload energy (kWh) and hourly carbon intensity (gCO₂/kWh).
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="job_id" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                label={{
                  value: 'kgCO₂',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="Baseline (Fixed Schedule) kgCO₂"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="GridAgent-AI (Optimized) kgCO₂"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
