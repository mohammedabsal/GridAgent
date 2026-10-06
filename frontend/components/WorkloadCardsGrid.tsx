import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Leaf,
  Play,
  Plus,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DemoScenarioMeta, WorkloadJob } from '../services/api';

interface WorkloadCardsGridProps {
  workloads: WorkloadJob[];
  selectedJobId: string;
  scenarios: DemoScenarioMeta[];
  busy: boolean;
  onSelectWorkload: (jobId: string) => void;
  onRunScenario: (scenarioId: string) => void;
  onRunAllScenarios: () => void;
  onOpenSubmitModal: () => void;
}

export const WorkloadCardsGrid: React.FC<WorkloadCardsGridProps> = ({
  workloads,
  selectedJobId,
  scenarios,
  busy,
  onSelectWorkload,
  onRunScenario,
  onRunAllScenarios,
  onOpenSubmitModal,
}) => {
  const getCardTheme = (w: WorkloadJob) => {
    if (w.status === 'BLOCKED') {
      return {
        dot: '🔴',
        statusText: 'PROTECTED (RUNNING)',
        aiDecisionText: 'DO NOT DELAY',
        energyTag: '🔴 Critical Service',
        border: 'border-rose-500/40 bg-rose-950/15',
      };
    }
    if (w.status === 'AWAITING_APPROVAL') {
      return {
        dot: '🟡',
        statusText: 'NEEDS HUMAN APPROVAL',
        aiDecisionText: `WAIT UNTIL ${w.recommended_start_time || '17:00'}`,
        energyTag: '🟡 High-Cost Workload',
        border: 'border-amber-500/40 bg-amber-950/15',
      };
    }
    if (w.decision === 'DEFER') {
      return {
        dot: '🟢',
        statusText:
          w.status === 'COMPLETED'
            ? 'COMPLETED CLEANLY'
            : w.status === 'RUNNING'
            ? 'RUNNING IN CLEAN WINDOW'
            : 'WAITING FOR CLEAN ENERGY',
        aiDecisionText: `RUN AT ${w.recommended_start_time || '17:00'}`,
        energyTag: `🟢 Cleaner Energy (-${w.carbon_reduction_pct}%)`,
        border: 'border-emerald-500/40 bg-emerald-950/15',
      };
    }
    return {
      dot: '🟠',
      statusText: w.status === 'COMPLETED' ? 'COMPLETED' : 'RUNNING NOW',
      aiDecisionText: 'RUN NOW',
      energyTag: '🟠 High Carbon (Urgent Deadline)',
      border: 'border-amber-500/35 bg-slate-900/90',
    };
  };

  return (
    <section className="rounded-3xl border border-slate-800/90 bg-slate-900/75 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            Interactive Workload Simulator
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            CLOUD WORKLOADS
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Click any workload card to inspect and simulate it inside the
            Digital Twin above.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            disabled={busy}
            onClick={onRunAllScenarios}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold transition"
          >
            ↺ Load All 5 Demo Workloads
          </button>
          <button
            disabled={busy}
            onClick={onOpenSubmitModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="h-4 w-4" /> Add Custom Workload
          </button>
        </div>
      </div>

      {/* Visual Workload Cards Grid (Section 9) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {workloads.map((w) => {
          const isSelected = w.job_id === selectedJobId;
          const theme = getCardTheme(w);
          const cleanName = w.name.replace(/\s*\([^)]*\)/, '');

          return (
            <div
              key={w.job_id}
              onClick={() => onSelectWorkload(w.job_id)}
              className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                theme.border
              } ${
                isSelected
                  ? 'ring-2 ring-emerald-400 shadow-xl shadow-emerald-950/30 scale-[1.01]'
                  : 'hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{theme.dot}</span>
                    <span>{cleanName}</span>
                  </h3>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400 text-slate-950">
                      SELECTED
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-950/80 border border-slate-800/90 rounded-xl p-3">
                  <div>
                    <span className="text-slate-400">Status: </span>
                    <strong className="text-white">{theme.statusText}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Energy: </span>
                    <strong className="font-mono text-white">
                      {w.energy_kwh} kWh
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Duration: </span>
                    <strong className="font-mono text-white">
                      {w.duration_minutes} min
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Deadline: </span>
                    <strong className="font-mono text-white">
                      {w.deadline}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">AI Decision: </span>
                  <strong className="font-mono text-emerald-300">
                    {theme.aiDecisionText}
                  </strong>
                </div>
                <span className="font-semibold text-slate-200">
                  {theme.energyTag}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Scenario Preset Launcher */}
      <div className="pt-2 border-t border-slate-800/80">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Or Test a Single Preset Scenario:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              disabled={busy}
              onClick={() => onRunScenario(sc.id)}
              className="p-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-800 border border-slate-800 text-left transition text-xs"
            >
              <div className="font-bold text-emerald-300">
                Scenario {sc.number}
              </div>
              <div className="font-semibold text-white truncate">
                {sc.title.replace(/^Scenario \d+:\s*/, '')}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

