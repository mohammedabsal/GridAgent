import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  Pause,
  Play,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { WorkloadJob } from '../services/api';

interface WorkloadTableProps {
  workloads: WorkloadJob[];
  busy: boolean;
  onAction: (jobId: string, action: string) => void;
}

export const WorkloadTable: React.FC<WorkloadTableProps> = ({
  workloads,
  busy,
  onAction,
}) => {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(
    workloads[0]?.job_id || null
  );

  const getStatusBadge = (status: WorkloadJob['status']) => {
    switch (status) {
      case 'DEFERRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
            <Clock className="h-3 w-3" /> DEFERRED
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-600 border border-sky-500/30">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />{' '}
            RUNNING
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> COMPLETED
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-600 border border-rose-500/30">
            <ShieldAlert className="h-3 w-3" /> BLOCKED
          </span>
        );
      case 'AWAITING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-600 border border-amber-500/30">
            <AlertTriangle className="h-3 w-3" /> AWAITING APPROVAL
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600">
            PAUSED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: WorkloadJob['priority']) => {
    const colors: Record<string, string> = {
      LOW: 'text-slate-500 bg-slate-100 border-slate-300',
      MEDIUM: 'text-sky-600 bg-sky-500/10 border-sky-500/30',
      HIGH: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
      CRITICAL: 'text-rose-600 bg-rose-500/15 border-rose-500/40 font-bold',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[11px] font-mono rounded border ${
          colors[priority] || colors.MEDIUM
        }`}
      >
        {priority}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#0d3f3a]">
            Enterprise Cloud Workload Queue &amp; AI Scheduling Decisions
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any workload row to inspect the full Explainable AI reasoning and Pydantic decision output.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {workloads.length} Workloads Tracked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-3">Job</th>
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Duration</th>
              <th className="py-3 px-3">Deadline</th>
              <th className="py-3 px-3">Current Status</th>
              <th className="py-3 px-3">Recommended Start</th>
              <th className="py-3 px-3">Carbon Impact</th>
              <th className="py-3 px-3">Decision / Governance</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 text-xs">
            {workloads.map((w) => {
              const isExpanded = expandedJobId === w.job_id;
              const savedKg = (w.estimated_carbon_savings_gco2 / 1000).toFixed(2);
              const baseKg = (w.baseline_emissions_gco2 / 1000).toFixed(2);
              const optKg = (w.optimized_emissions_gco2 / 1000).toFixed(2);

              return (
                <React.Fragment key={w.job_id}>
                  <tr
                    onClick={() =>
                      setExpandedJobId(isExpanded ? null : w.job_id)
                    }
                    className={`cursor-pointer transition ${
                      isExpanded
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-100/30'
                    }`}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-[#0d3f3a]">
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        )}
                        <div>
                          <div>{w.job_id}</div>
                          <div className="text-[11px] font-sans font-normal text-slate-500 truncate max-w-[180px]">
                            {w.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {w.workload_type}
                    </td>

                    <td className="py-3.5 px-3">
                      {getPriorityBadge(w.priority)}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {w.duration_minutes} min
                      <div className="text-[10px] text-slate-500">
                        {w.energy_kwh} kWh
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-700 font-semibold">
                      {w.deadline}
                    </td>

                    <td className="py-3.5 px-3">{getStatusBadge(w.status)}</td>

                    <td className="py-3.5 px-3 font-mono">
                      {w.status === 'BLOCKED' ? (
                        <span className="text-rose-600 font-semibold">
                          Unmodified
                        </span>
                      ) : (
                        <div>
                          <span className="text-emerald-600 font-bold">
                            {w.recommended_start_time || w.submitted_at_time}
                          </span>
                          {w.predicted_carbon_intensity && (
                            <div className="text-[10px] text-slate-500">
                              {w.predicted_carbon_intensity} gCO₂/kWh
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div className="space-y-1">
                        <div>
                          {w.estimated_carbon_savings_gco2 > 0 ? (
                            <>
                              <span className="text-emerald-600 font-bold">
                                -{savedKg} kgCO₂ (-{w.carbon_reduction_pct}%)
                              </span>
                              {w.confidence !== undefined && (
                                <span className="ml-2 text-[10px] font-mono text-emerald-600">
                                  conf {w.confidence.toFixed(2)}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500">
                              {baseKg} kgCO₂ (0% delta)
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {baseKg} → {optKg} kg • -${w.estimated_cost_savings_usd.toFixed(2)}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`font-mono font-bold text-[11px] ${
                            w.decision === 'DEFER'
                              ? 'text-emerald-600'
                              : w.decision === 'BLOCKED_BY_SAFETY'
                              ? 'text-rose-600'
                              : w.decision === 'ASK_USER'
                              ? 'text-amber-600'
                              : 'text-sky-600'
                          }`}
                        >
                          {w.decision || 'QUEUED'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-slate-500" />
                          Policy: {w.policy_decision || 'N/A'}
                        </span>
                      </div>
                    </td>

                    <td
                      className="py-3.5 px-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === 'AWAITING_APPROVAL' && (
                          <>
                            <button
                              disabled={busy}
                              onClick={() => onAction(w.job_id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition"
                            >
                              Approve
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => onAction(w.job_id, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 border border-rose-500/30 font-semibold text-xs transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {w.status === 'DEFERRED' && (
                          <button
                            disabled={busy}
                            onClick={() => onAction(w.job_id, 'start')}
                            title="Force start immediately"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-sky-600 transition"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {w.status === 'RUNNING' && (
                          <button
                            disabled={busy}
                            onClick={() => onAction(w.job_id, 'pause')}
                            title="Pause running workload"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-amber-600 transition"
                          >
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {w.status === 'PAUSED' && (
                          <button
                            disabled={busy}
                            onClick={() => onAction(w.job_id, 'resume')}
                            title="Resume paused workload"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-emerald-600 transition"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {['QUEUED', 'DEFERRED', 'RUNNING', 'PAUSED'].includes(
                          w.status
                        ) && (
                          <button
                            disabled={busy}
                            onClick={() => onAction(w.job_id, 'cancel')}
                            title="Cancel workload"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expandable Explainability Drawer */}
                  {isExpanded && (
                    <tr className="bg-white border-b border-slate-200">
                      <td colSpan={10} className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div className="lg:col-span-2 space-y-2.5">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                              <Info className="h-4 w-4" />
                              EXPLAINABLE AI SCHEDULING RATIONALE (WHY THIS DECISION WAS MADE)
                            </div>
                            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm leading-relaxed">
                              {w.decision_reason ||
                                'Workload is queued for agent orchestration.'}
                            </div>
                            {w.policy_reason && (
                              <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                                <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-indigo-600">
                                    Safety &amp; Governance Validation ({w.policy_decision}):{' '}
                                  </span>
                                  {w.policy_reason}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Structured Pydantic Decision JSON Preview */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-600 overflow-x-auto">
                            <div className="text-slate-500 font-semibold mb-1.5 flex items-center justify-between">
                              <span>Pydantic Validated Output</span>
                              <span className="text-emerald-600">
                                conf: {w.confidence ?? 0.94}
                              </span>
                            </div>
                            <pre className="text-[10px] leading-snug text-emerald-600/90">
                              {JSON.stringify(
                                {
                                  job_id: w.job_id,
                                  decision: w.decision,
                                  recommended_start_time:
                                    w.recommended_start_time,
                                  current_carbon_intensity:
                                    w.current_carbon_intensity,
                                  predicted_carbon_intensity:
                                    w.predicted_carbon_intensity,
                                  estimated_carbon_savings:
                                    w.estimated_carbon_savings_gco2,
                                  estimated_cost_savings:
                                    w.estimated_cost_savings_usd,
                                  deadline: w.deadline,
                                  confidence: w.confidence,
                                },
                                null,
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
