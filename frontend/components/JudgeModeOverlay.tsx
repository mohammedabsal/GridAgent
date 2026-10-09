import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Film,
  Flame,
  Leaf,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { WorkloadJob } from '../services/api';

interface JudgeModeOverlayProps {
  isOpen: boolean;
  workload: WorkloadJob;
  onClose: () => void;
  onJumpToHour: (hour: number) => void;
}

export const JudgeModeOverlay: React.FC<JudgeModeOverlayProps> = ({
  isOpen,
  workload,
  onClose,
  onJumpToHour,
}) => {
  const [step, setStep] = useState<number>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }
    // Synchronize the Digital Twin hour with each guided story step
    if (step === 1 || step === 2) {
      onJumpToHour(15);
    } else if (step === 3 || step === 4 || step === 5) {
      onJumpToHour(17);
    } else if (step === 6) {
      onJumpToHour(18);
    }
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen || !autoPlay) return;
    const timer = setTimeout(() => {
      if (step < 6) {
        setStep((s) => s + 1);
      } else {
        setAutoPlay(false);
      }
    }, 6000);
    return () => clearTimeout(timer);
  }, [isOpen, autoPlay, step]);

  if (!isOpen) return null;

  const carbonRed =
    workload.carbon_reduction_pct > 0 ? workload.carbon_reduction_pct : 44.3;
  const costRed =
    workload.cost_reduction_pct > 0 ? workload.cost_reduction_pct : 59.1;
  const recTime = workload.recommended_start_time || '17:00';

  const storySteps = [
    {
      num: 1,
      badge: 'STEP 1 OF 6 · THE PROBLEM',
      headline: 'Here is the problem.',
      body: 'Your AI Model Training workload wants to run right now at 15:00. However, the electricity grid is currently heavily reliant on fossil fuels (700 gCO₂/kWh — High Carbon).',
      visual: (
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-center space-y-2">
          <div className="text-xs font-bold uppercase text-rose-600">
            Current Grid at 15:00
          </div>
          <div className="text-4xl font-extrabold font-mono text-[#0d3f3a]">
            700 gCO₂/kWh
          </div>
          <div className="text-sm font-bold text-rose-600">
            🔴 High Carbon Intensity · Low Renewable Share (18.8%)
          </div>
        </div>
      ),
    },
    {
      num: 2,
      badge: 'STEP 2 OF 6 · DIGITAL TWIN FORECAST',
      headline: 'The Digital Twin predicts what happens if we wait.',
      body: 'GridAgent-AI builds a live Digital Twin of your cloud servers and the 24-hour energy grid, simulating carbon emissions and electricity costs for every future hour.',
      visual: (
        <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40">
            <div className="font-bold text-[#0d3f3a]">15:00</div>
            <div className="text-rose-600 font-extrabold mt-1">700 gCO₂</div>
            <div className="text-[10px] text-slate-500">🔴 Now</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="font-bold text-[#0d3f3a]">16:00</div>
            <div className="text-amber-600 font-extrabold mt-1">450 gCO₂</div>
            <div className="text-[10px] text-slate-500">🟡 Clearing</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-400 ring-2 ring-emerald-400/50">
            <div className="font-bold text-[#0d3f3a]">17:00</div>
            <div className="text-emerald-600 font-extrabold mt-1">390 gCO₂</div>
            <div className="text-[10px] text-emerald-600">🟢 Cleanest</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="font-bold text-[#0d3f3a]">18:00</div>
            <div className="text-emerald-600 font-extrabold mt-1">420 gCO₂</div>
            <div className="text-[10px] text-slate-500">🟢 Clean</div>
          </div>
        </div>
      ),
    },
    {
      num: 3,
      badge: 'STEP 3 OF 6 · AI OPTIMIZATION',
      headline: 'AI finds a cleaner execution window.',
      body: `At ${recTime}, coastal wind and afternoon solar push grid carbon down from 700 to 390 gCO₂/kWh while electricity prices drop from $0.22 to $0.09/kWh.`,
      visual: (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
          <div className="text-xs font-bold uppercase text-emerald-600">
            Optimal Window Identified
          </div>
          <div className="text-4xl font-extrabold font-mono text-emerald-600">
            {recTime} (390 gCO₂/kWh)
          </div>
          <div className="text-sm font-bold text-emerald-700">
            🌱 43.3% Renewable Energy · Lowest Carbon &amp; Cost Window
          </div>
        </div>
      ),
    },
    {
      num: 4,
      badge: 'STEP 4 OF 6 · SAFETY GOVERNANCE',
      headline: 'Safety system checks whether waiting is allowed.',
      body: 'Before delaying any job, the Safety Check verifies that the workload is not a protected live service and will finish well before its 20:00 deadline.',
      visual: (
        <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-400 text-center space-y-2">
          <div className="text-3xl font-extrabold text-emerald-600">
            🟢 SAFE TO WAIT
          </div>
          <div className="text-xs sm:text-sm text-slate-700">
            60-minute workload running at 17:00 finishes at 18:00 — 2 hours
            ahead of its 20:00 deadline.
          </div>
        </div>
      ),
    },
    {
      num: 5,
      badge: 'STEP 5 OF 6 · SMART SCHEDULING',
      headline: 'Workload moves to the cleaner window.',
      body: 'GridAgent-AI automatically shifts the workload from 15:00 to 17:00 and starts the cloud compute servers when clean energy arrives.',
      visual: (
        <div className="p-5 rounded-2xl bg-white border border-slate-300 flex items-center justify-center gap-4 text-center font-mono">
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40">
            <div className="text-xs text-rose-600">15:00 (High Carbon)</div>
            <div className="text-lg font-bold text-[#0d3f3a]">PAUSED / DEFERRED</div>
          </div>
          <ArrowRight className="h-6 w-6 text-emerald-600 animate-pulse" />
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-400">
            <div className="text-xs text-emerald-600">17:00 (Clean Energy)</div>
            <div className="text-lg font-bold text-emerald-600">
              ⚡ RUNNING CLEANLY
            </div>
          </div>
        </div>
      ),
    },
    {
      num: 6,
      badge: 'STEP 6 OF 6 · THE RESULT',
      headline: 'Same workload. Same output. Cleaner electricity.',
      body: "By simulating the energy grid and waiting just 2 hours, GridAgent-AI dramatically cuts carbon emissions and cloud energy cost with zero deadline risk.",
      visual: (
        <div className="space-y-4 text-center">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-950/50 border border-emerald-400">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-600">
                {carbonRed}%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mt-1">
                LESS CARBON
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-teal-950/50 border border-teal-400">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-teal-600">
                {costRed}%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-200 mt-1">
                LOWER COST
              </div>
            </div>
          </div>
          <div className="text-lg font-extrabold text-[#0d3f3a]">
            That&apos;s GridAgent-AI.
          </div>
        </div>
      ),
    },
  ];

  const current = storySteps[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/85 backdrop-blur-md p-4">
      <div className="bg-white border border-emerald-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-600">
              {current.badge}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-[#0d3f3a]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <button
              key={idx}
              onClick={() => {
                setAutoPlay(false);
                setStep(idx);
              }}
              className={`h-2 rounded-full transition-all ${
                idx <= step ? 'bg-emerald-400' : 'bg-slate-100'
              }`}
            />
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0d3f3a]">
            {current.headline}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {current.body}
          </p>
        </div>

        <div>{current.visual}</div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            onClick={() => {
              setAutoPlay(false);
              setStep((s) => Math.max(1, s - 1));
            }}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            ← Previous
          </button>

          <span className="text-xs font-mono text-slate-500">
            {autoPlay ? 'Auto-advancing...' : 'Manual Step Mode'}
          </span>

          {step < 6 ? (
            <button
              onClick={() => {
                setAutoPlay(false);
                setStep((s) => s + 1);
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
            >
              Next Step →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition"
            >
              Explore Live Digital Twin →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

