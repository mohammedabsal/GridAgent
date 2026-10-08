import React from 'react';
import type {
  DashboardState,
} from '../services/api';
import {
  Clock,
  FlaskConical,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { AnimatedNumber } from './motion';

interface RecommendedDashboardLayoutProps {
  data: DashboardState;
}

/** Format a timestamp string to HH:MM display. Falls back to raw string on parse failure. */
const formatTime = (timeStr: string): string => {
  if (!timeStr) return '—';
  const trimmed = timeStr.trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (isNaN(d.getTime())) return trimmed;
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatKgCO2 = (gco2: number): string => {
  if (!gco2) return '0.00 kgCO2';
  const kg = gco2 / 1000;
  return kg >= 1 ? kg.toFixed(2) + ' kgCO2' : (kg * 1000).toFixed(0) + ' gCO2';
};

const formatUsd = (usd: number): string => {
  if (!usd) return '$0.00';
  return '$' + usd.toFixed(2);
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'RUNNING':
      return 'text-emerald-700';
    case 'COMPLETED':
      return 'text-emerald-700';
    case 'QUEUED':
      return 'text-amber-600';
    case 'DEFERRED':
      return 'text-indigo-600';
    case 'BLOCKED':
      return 'text-rose-600';
    case 'FAILED':
      return 'text-rose-600';
    case 'CANCELLED':
      return 'text-slate-500';
    case 'PAUSED':
      return 'text-slate-500';
    case 'AWAITING_APPROVAL':
      return 'text-amber-600';
    default:
      return 'text-slate-500';
  }
};

const getDecisionChip = (decision: string | null, policy: string | null): string => {
  if (policy === 'DENY') return 'DENIED';
  if (policy === 'ASK_USER') return 'ASK USER';
  if (decision === 'DEFER') return 'DEFER';
  if (decision === 'BLOCKED_BY_SAFETY') return 'BLOCKED';
  return 'RUN NOW';
};

export const RecommendedDashboardLayout: React.FC<RecommendedDashboardLayoutProps> = ({
  data,
}) => {
  const grid = data.grid_status;
  const workloads = data.workloads;
  const comparison = data.comparison;

  const selected = workloads[0] || null;

  const isCleanWindow = grid.carbon_intensity_gco2_kwh <= 420;
  const isHighCarbon = grid.carbon_intensity_gco2_kwh >= 600;

  const latestDecision = selected
    ? {
        name: selected.name,
        type: selected.workload_type,
        status: selected.status,
        recommended: selected.recommended_start_time,
        decision: selected.decision,
        policy: selected.policy_decision,
        currentCarbon: selected.current_carbon_intensity ?? grid.carbon_intensity_gco2_kwh,
        predictedCarbon: selected.predicted_carbon_intensity ?? grid.carbon_intensity_gco2_kwh,
        baselineEmissions: selected.baseline_emissions_gco2,
        optimizedEmissions: selected.optimized_emissions_gco2,
        carbonReduction: selected.carbon_reduction_pct,
        baselineCost: selected.baseline_cost_usd,
        optimizedCost: selected.optimized_cost_usd,
        costSavings: selected.estimated_cost_savings_usd,
        isProtected: selected.is_protected_service,
        reason: selected.decision_reason,
      }
    : null;

  return (
    <div className="space-y-5">

      {/* ============================================ */}
      {/* TOP BANNER */}
      {/* ============================================ */}
      <div className="border border-slate-200/80 bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-emerald-700 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0d3f3a]">
                  GridAgent-AI — Recommended Dashboard
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  RECOMMENDED
                </span>
                {grid.is_simulated ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    SIMULATION ({data.active_profile})
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                    LIVE TELEMETRY
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Carbon-aware scheduling for cloud workloads · PERCEIVE → REASON → SAFETY → EXECUTE
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span className="font-mono font-semibold text-[#0d3f3a]">
                {formatTime(grid.current_time)}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 bg-slate-50 border rounded-xl px-3 py-2 transition-colors duration-500 ${
                isCleanWindow
                  ? 'border-emerald-300'
                  : isHighCarbon
                  ? 'border-rose-300'
                  : 'border-amber-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isCleanWindow
                    ? 'bg-emerald-500'
                    : isHighCarbon
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="font-mono font-semibold text-[#0d3f3a]">
                <AnimatedNumber
                  value={grid.carbon_intensity_gco2_kwh}
                  decimals={0}
                  suffix=" gCO2/kWh"
                />
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-500">Region</span>
              <span className="font-mono text-[#0d3f3a]">
                <AnimatedNumber
                  value={grid.renewable_percentage}
                  decimals={1}
                  suffix="% renewable"
                />
              </span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-500">Profile</span>
              <span className="font-mono text-[#0d3f3a]">{data.active_profile}</span>
            </div>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="border border-slate-200/80 bg-white rounded-2xl p-5 sm:p-6 shadow-sm ga-card-hover">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
              Latest Decision
            </h2>
            {latestDecision && latestDecision.isProtected && (
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                PROTECTED
              </span>
            )}
          </div>
          {latestDecision ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Job</span>
                <span className="font-mono font-semibold text-[#0d3f3a]">
                  {latestDecision.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Type</span>
                <span className="font-mono text-[#0d3f3a]">
                  {latestDecision.type}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-mono font-semibold ${getStatusColor(latestDecision.status)}`}>
                  {latestDecision.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Recommended Start</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {formatTime(latestDecision.recommended ?? '—')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Decision</span>
                <span className="font-mono font-semibold text-[#0d3f3a]">
                  {getDecisionChip(latestDecision.decision || null, latestDecision.policy || null)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Carbon</span>
                <span className="font-mono text-[#0d3f3a]">
                  <AnimatedNumber
                    value={latestDecision.currentCarbon}
                    decimals={0}
                    suffix=" gCO2/kWh"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Predicted Carbon</span>
                <span className="font-mono text-emerald-700">
                  <AnimatedNumber
                    value={latestDecision.predictedCarbon}
                    decimals={0}
                    suffix=" gCO2/kWh"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-500">Carbon Saved</span>
                <span className="font-mono font-semibold text-emerald-700">
                  <AnimatedNumber
                    value={
                      (latestDecision.baselineEmissions -
                        latestDecision.optimizedEmissions) /
                      1000
                    }
                    decimals={2}
                    suffix=" kgCO2"
                  />
                </span>
              </div>
              {latestDecision.reason && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {latestDecision.reason}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                <FlaskConical className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500">No jobs queued</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Submit a workload to see decisions
              </p>
            </div>
          )}
        </div>



        <div className="border border-slate-200/80 bg-white rounded-2xl p-5 sm:p-6 shadow-sm ga-card-hover">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
              Estimated Impact
            </h2>
          </div>
          {comparison.total_jobs_evaluated > 0 ? (
            <div className="space-y-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Total Carbon Saved</span>
                <span className="font-mono font-bold text-emerald-700">
                  <AnimatedNumber
                    value={comparison.total_carbon_saved_gco2 / 1000}
                    decimals={2}
                    suffix=" kgCO2"
                  />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Cost Saved</span>
                <span className="font-mono font-bold text-teal-700">
                  <AnimatedNumber
                    value={comparison.total_cost_saved_usd}
                    decimals={2}
                    prefix="$"
                  />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Carbon Reduction</span>
                <span className="font-mono font-bold text-emerald-700">
                  <AnimatedNumber
                    value={comparison.carbon_reduction_percentage}
                    decimals={1}
                    prefix="-"
                    suffix="%"
                  />
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500">Cost Reduction</span>
                <span className="font-mono font-bold text-teal-700">
                  <AnimatedNumber
                    value={comparison.cost_reduction_percentage}
                    decimals={1}
                    prefix="-"
                    suffix="%"
                  />
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-slate-500">Jobs Evaluated</span>
                <span className="font-mono text-[#0d3f3a]">
                  {comparison.total_jobs_evaluated} jobs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Optimised</span>
                <span className="font-mono text-[#0d3f3a]">
                  {comparison.optimized_jobs_count} jobs
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Blocked / Approvals</span>
                <span className="font-mono text-[#0d3f3a]">
                  {comparison.blocked_jobs_count} blocked ·{' '}
                  {comparison.awaiting_approval_count} awaiting approval
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
                <TrendingUp className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-xs text-slate-500">No data yet</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Run simulation to see impact
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

