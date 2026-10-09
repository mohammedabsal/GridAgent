import React, { useState } from 'react';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Leaf,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { GridStatus, WorkloadJob } from '../services/api';

interface AIRecommendationAndSafetyProps {
  workload: WorkloadJob;
  gridStatus: GridStatus;
  policyRules: {
    DENY: string[];
    ALLOW: string[];
    ASK_USER: string[];
  };
  busy: boolean;
  onAction: (jobId: string, action: string) => void;
}

export const AIRecommendationAndSafety: React.FC<
  AIRecommendationAndSafetyProps
> = ({ workload, gridStatus, policyRules, busy, onAction }) => {
  const [showPolicyRules, setShowPolicyRules] = useState(false);

  const recStart =
    workload.recommended_start_time || workload.submitted_at_time;
  const isDeferred = workload.decision === 'DEFER';
  const isBlocked = workload.status === 'BLOCKED';
  const isAskUser = workload.status === 'AWAITING_APPROVAL';

  // Build plain-English 4-step human explanation (Section 6)
  let recommendationLabel = `WAIT UNTIL ${recStart}`;
  let reasons: string[] = [];
  let conclusion =
    'Waiting reduces environmental impact without affecting the deadline.';

  if (isBlocked) {
    recommendationLabel = 'DO NOT DELAY (KEEP RUNNING)';
    reasons = [
      '🚨 This workload is a mission-critical production service',
      '🛡 Safety rules forbid automatic delays on live customer services',
      '⚡ Even though the grid is carbon-intensive, reliability comes first',
      '🔒 AI is blocked from modifying this schedule',
    ];
    conclusion = 'Protecting live critical services is always prioritized.';
  } else if (isAskUser) {
    recommendationLabel = `WAIT UNTIL ${recStart} (CONFIRM FIRST)`;
    reasons = [
      `🌱 Cleaner electricity is available at ${recStart} (${workload.predicted_carbon_intensity} gCO₂/kWh)`,
      `💰 Waiting saves $${workload.estimated_cost_savings_usd.toFixed(2)} and ${(workload.estimated_carbon_savings_gco2 / 1000).toFixed(1)} kgCO₂`,
      `⚠️ However, this is a high-cost / high-impact workload ($${workload.estimated_cloud_cost_usd})`,
      '👤 Safety rules require a human to approve moving large migrations',
    ];
    conclusion =
      'AI found big carbon savings, but asks for your sign-off before rescheduling.';
  } else if (isDeferred) {
    recommendationLabel = `WAIT UNTIL ${recStart}`;
    reasons = [
      `🌱 Renewable energy share increases significantly by ${recStart}`,
      `🌍 Expected grid carbon drops from ${workload.current_carbon_intensity} to ${workload.predicted_carbon_intensity} gCO₂/kWh (-${workload.carbon_reduction_pct}%)`,
      `💰 Electricity cost is lower, saving $${workload.estimated_cost_savings_usd.toFixed(2)}`,
      `⏰ The ${workload.deadline} deadline easily allows this ${workload.duration_minutes}-minute workload to wait`,
    ];
    conclusion =
      'Waiting reduces environmental impact without affecting the deadline.';
  } else {
    recommendationLabel = 'RUN NOW';
    reasons = [
      `⏰ Deadline (${workload.deadline}) is very close for a ${workload.duration_minutes}-minute job`,
      `⚡ Current grid is ${workload.current_carbon_intensity ?? gridStatus.carbon_intensity_gco2_kwh} gCO₂/kWh`,
      '🌱 A cleaner energy window occurs later in the afternoon',
      '🚨 Waiting would violate the workload deadline or priority requirement',
    ];
    conclusion = 'Running now is safer than waiting.';
  }

  // Traffic-light status for Safety Check (Section 8)
  const policyUpper = (workload.policy_decision || 'ALLOW').toUpperCase();
  const isAllow = policyUpper.includes('ALLOW');
  const isDeny = policyUpper.includes('DENY') || isBlocked;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* LEFT CARD: WHY DID THE AI CHOOSE THIS? (Section 6) */}
      <div className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
              Plain-English AI Explanation
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0d3f3a] mt-1">
              WHY DID THE AI CHOOSE THIS?
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">
                🤖 GridAgent-AI recommends:
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-0.5">
                &ldquo;{recommendationLabel}&rdquo;
              </div>
            </div>
            <Brain className="h-8 w-8 text-purple-600 shrink-0" />
          </div>

          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Why?
            </div>
            {reasons.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-700 flex items-start gap-2.5"
              >
                <span className="font-mono font-bold text-emerald-600">
                  {idx + 1}.
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/35 text-xs sm:text-sm text-emerald-700">
          <span className="font-bold text-emerald-600">Therefore: </span>
          &ldquo;{conclusion}&rdquo;
        </div>
      </div>

      {/* RIGHT CARD: AI SAFETY CHECK (Section 8) */}
      <div className="rounded-3xl border border-slate-200 bg-white backdrop-blur-xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-5">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
              Is It Safe To Wait?
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0d3f3a] mt-1">
              AI SAFETY CHECK
            </h2>
          </div>

          {/* Traffic Light Indicator Strip */}
          <div className="grid grid-cols-3 gap-2.5 text-xs">
            <div
              className={`p-3 rounded-2xl border transition-all ${
                isAllow && !isAskUser && !isDeny
                  ? 'bg-emerald-950/40 border-emerald-400 ring-1 ring-emerald-400/50 text-white'
                  : 'bg-white border-slate-200 text-slate-500 opacity-60'
              }`}
            >
              <div className="font-extrabold text-emerald-600">🟢 ALLOW</div>
              <div className="text-[11px] mt-0.5">
                Safe to automatically schedule
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                isAskUser
                  ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400/50 text-white'
                  : 'bg-white border-slate-200 text-slate-500 opacity-60'
              }`}
            >
              <div className="font-extrabold text-amber-600">🟡 ASK USER</div>
              <div className="text-[11px] mt-0.5">
                Requires human approval
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border transition-all ${
                isDeny
                  ? 'bg-rose-950/40 border-rose-400 ring-1 ring-rose-400/50 text-white'
                  : 'bg-white border-slate-200 text-slate-500 opacity-60'
              }`}
            >
              <div className="font-extrabold text-rose-600">🔴 BLOCK</div>
              <div className="text-[11px] mt-0.5">
                Policy prevents modification
              </div>
            </div>
          </div>

          {/* Selected Workload Safety Verdict */}
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              isDeny
                ? 'bg-rose-950/30 border-rose-500/40'
                : isAskUser
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-emerald-950/30 border-emerald-500/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Workload: <strong className="text-[#0d3f3a]">{workload.name}</strong>
              </div>
              <span className="text-sm font-extrabold">
                {isDeny
                  ? '🔴 BLOCKED'
                  : isAskUser
                  ? '🟡 APPROVAL NEEDED'
                  : '🟢 ALLOWED'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {isDeny
                ? 'This workload is mission-critical and cannot be delayed automatically.'
                : isAskUser
                ? 'This high-impact workload exceeds the automatic cost/energy threshold and requires your approval before waiting.'
                : 'The workload can safely be scheduled without violating its deadline or service reliability.'}
            </p>

            {/* Interactive Human-in-the-Loop Approval Buttons */}
            {isAskUser && (
              <div className="pt-2 flex items-center gap-3">
                <button
                  disabled={busy}
                  onClick={() => onAction(workload.job_id, 'approve')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
                >
                  ✓ Approve Waiting Until {recStart}
                </button>
                <button
                  disabled={busy}
                  onClick={() => onAction(workload.job_id, 'reject')}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 border border-rose-500/40 font-bold text-xs transition"
                >
                  ✕ Reject &amp; Keep Current Schedule
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progressive Disclosure: Expandable Safety Rules */}
        <div>
          <button
            onClick={() => setShowPolicyRules(!showPolicyRules)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:text-[#0d3f3a] transition"
          >
            <span>View Safety Policy Guardrails</span>
            {showPolicyRules ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showPolicyRules && (
            <div className="mt-3 p-4 rounded-xl bg-white border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <div className="font-bold text-emerald-600 mb-1">
                  🟢 Always Allowed
                </div>
                <ul className="space-y-0.5 text-slate-600">
                  {policyRules.ALLOW.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-bold text-amber-600 mb-1">
                  🟡 Ask Human First
                </div>
                <ul className="space-y-0.5 text-slate-600">
                  {policyRules.ASK_USER.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="font-bold text-rose-600 mb-1">
                  🔴 Protected (Never Delay)
                </div>
                <ul className="space-y-0.5 text-slate-600">
                  {policyRules.DENY.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

