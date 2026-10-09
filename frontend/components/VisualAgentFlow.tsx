import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Eye,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AgentActivityEvent } from '../services/api';

interface VisualAgentFlowProps {
  events: AgentActivityEvent[];
}

export const VisualAgentFlow: React.FC<VisualAgentFlowProps> = ({ events }) => {
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  const steps = [
    {
      id: 'PERCEIVE',
      emoji: '👁',
      actionTitle: 'OBSERVE',
      plainSubtitle: 'Observe the grid & workload',
      techName: 'Perception & Workload Agents',
      description:
        'Reads current electricity carbon intensity, 24-hour solar/wind weather forecasts, and your cloud workload deadline.',
      color: 'border-sky-500/40 bg-sky-950/20 text-sky-600',
    },
    {
      id: 'REASON',
      emoji: '🧠',
      actionTitle: 'THINK',
      plainSubtitle: 'Find the best time',
      techName: 'Reasoning Agent',
      description:
        'Simulates every possible execution window before the deadline to find the lowest-carbon, lowest-cost time.',
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-600',
    },
    {
      id: 'SAFETY',
      emoji: '🛡',
      actionTitle: 'CHECK',
      plainSubtitle: 'Check safety rules',
      techName: 'Safety Governance Agent',
      description:
        'Verifies that waiting will never break a deadline or delay a protected customer-facing service.',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-600',
    },
    {
      id: 'EXECUTE',
      emoji: '⚡',
      actionTitle: 'ACT',
      plainSubtitle: 'Execute workload',
      techName: 'Execution Agent',
      description:
        'Automatically schedules the cloud servers to run the workload during the approved clean energy window.',
      color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-600',
    },
  ];

  const matchingEvents = selectedStep
    ? events.filter((e) =>
        selectedStep === 'PERCEIVE'
          ? e.stage === 'PERCEIVE' || e.stage === 'WORKLOAD'
          : e.stage === selectedStep
      )
    : [];

  return (
    <section
      id="how-it-works-section"
      className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            How GridAgent-AI Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0d3f3a] mt-1">
            OBSERVE → THINK → CHECK → ACT
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Four specialized AI steps work together automatically. Click any
            step to inspect its live activity log.
          </p>
        </div>
      </div>

      {/* Horizontal 4-Step Visual Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const isSelected = selectedStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() =>
                setSelectedStep(isSelected ? null : step.id)
              }
              className={`text-left rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                step.color
              } ${
                isSelected
                  ? 'ring-2 ring-emerald-400 scale-[1.01]'
                  : 'hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{step.emoji}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-slate-600">
                    {isSelected ? 'Hide Logs' : 'Click for Details'}
                  </span>
                </div>
                <div className="text-xl font-extrabold text-[#0d3f3a] mt-3">
                  {step.actionTitle}
                </div>
                <div className="text-sm font-bold text-emerald-600 mt-0.5">
                  &ldquo;{step.plainSubtitle}&rdquo;
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                Engine: {step.techName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Progressive Disclosure: Live Logs for Selected Step */}
      {selectedStep && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Live Activity Logs for {selectedStep} Step ({matchingEvents.length}{' '}
              recent events)
            </div>
            <button
              onClick={() => setSelectedStep(null)}
              className="text-xs text-slate-500 hover:text-[#0d3f3a]"
            >
              Close ✕
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {matchingEvents.slice(0, 8).map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-white border border-slate-200 text-xs"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>
                    {evt.agent_name} {evt.job_id ? `• ${evt.job_id}` : ''}
                  </span>
                  <span>Sim Time: {evt.simulation_time}</span>
                </div>
                <div className="font-bold text-[#0d3f3a] mt-0.5">{evt.title}</div>
                <div className="text-slate-600 mt-0.5">{evt.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

