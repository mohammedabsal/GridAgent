import React from 'react';
import {
  Clock,
  Film,
  Flame,
  HelpCircle,
  Leaf,
  Play,
  Sparkles,
  Sun,
} from 'lucide-react';
import { GridStatus, WorkloadJob } from '../services/api';

interface HeroSectionProps {
  gridStatus: GridStatus;
  selectedWorkload: WorkloadJob;
  simulatingDecision: boolean;
  onRunSimulation: () => void;
  onOpenJudgeMode: () => void;
  onScrollToHowItWorks: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  gridStatus,
  selectedWorkload,
  simulatingDecision,
  onRunSimulation,
  onOpenJudgeMode,
  onScrollToHowItWorks,
}) => {
  const carbon = gridStatus.carbon_intensity_gco2_kwh;
  const isHighCarbon = carbon >= 550;
  const isLowCarbon = carbon <= 420;

  const carbonStatusText = isHighCarbon
    ? 'High right now'
    : isLowCarbon
    ? 'Clean right now'
    : 'Moderate right now';

  const renewable = gridStatus.renewable_percentage;
  const renewableStatusText =
    renewable < 25
      ? 'Low right now'
      : renewable >= 40
      ? 'High clean energy share'
      : 'Moderate solar & wind';

  const recStart =
    selectedWorkload.recommended_start_time || selectedWorkload.submitted_at_time;
  const isDeferred =
    selectedWorkload.decision === 'DEFER' &&
    recStart !== gridStatus.current_time;
  const isBlocked = selectedWorkload.status === 'BLOCKED';
  const isAskUser = selectedWorkload.status === 'AWAITING_APPROVAL';

  let aiHeadline = `Wait until ${recStart}`;
  let aiSubtext = 'Cleaner energy window';

  if (isBlocked) {
    aiHeadline = 'Keep Running Now';
    aiSubtext = 'Protected critical service';
  } else if (isAskUser) {
    aiHeadline = `Wait until ${recStart} (Confirm)`;
    aiSubtext = 'Awaiting human approval';
  } else if (!isDeferred) {
    if (gridStatus.current_time === recStart && isLowCarbon) {
      aiHeadline = `Run Now (${recStart})`;
      aiSubtext = 'Clean energy window active';
    } else {
      aiHeadline = 'Run Immediately';
      aiSubtext = `Deadline (${selectedWorkload.deadline}) is close`;
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50 p-6 sm:p-10 shadow-2xl">
      {/* Subtle Ambient Glows */}
      <div className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-300/70 text-xs font-medium text-emerald-600 shadow-inner">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Digital Twin Control Center for Carbon-Aware Cloud Computing</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0d3f3a] leading-[1.1]">
          Run Cloud Workloads When{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Energy Is Cleaner.
          </span>
        </h1>

        <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          GridAgent-AI creates a digital twin of your cloud infrastructure and
          simulates the best time to run each workload — balancing carbon, cost,
          performance, and deadlines.
        </p>

        {/* Three Simple Visual Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 text-left max-w-3xl mx-auto">
          {/* Metric 1: CARBON */}
          <div
            className={`rounded-2xl p-4 border backdrop-blur-md transition-all ${
              isHighCarbon
                ? 'bg-rose-950/25 border-rose-500/35 shadow-lg shadow-rose-600/20'
                : isLowCarbon
                ? 'bg-emerald-950/25 border-emerald-500/35 shadow-lg shadow-emerald-600/20'
                : 'bg-amber-950/20 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Carbon</span>
              <Flame
                className={`h-4 w-4 ${
                  isHighCarbon
                    ? 'text-rose-600'
                    : isLowCarbon
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0d3f3a] mt-1.5">
              {carbon}{' '}
              <span className="text-sm font-normal text-slate-500">
                gCO₂/kWh
              </span>
            </div>
            <div
              className={`text-xs font-semibold mt-1 inline-flex items-center gap-1.5 ${
                isHighCarbon
                  ? 'text-rose-600'
                  : isLowCarbon
                  ? 'text-emerald-600'
                  : 'text-amber-600'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isHighCarbon
                    ? 'bg-rose-400 animate-pulse'
                    : isLowCarbon
                    ? 'bg-emerald-400'
                    : 'bg-amber-400'
                }`}
              />
              {carbonStatusText} ({gridStatus.current_time})
            </div>
          </div>

          {/* Metric 2: RENEWABLE ENERGY */}
          <div className="rounded-2xl p-4 border border-slate-200 bg-white backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Renewable Energy</span>
              <Sun className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1.5">
              {renewable}%
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              {renewableStatusText}
            </div>
          </div>

          {/* Metric 3: AI RECOMMENDATION */}
          <div className="rounded-2xl p-4 border border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-slate-100 to-cyan-50 backdrop-blur-md shadow-lg shadow-emerald-600/30">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-600">
              <span>AI Recommendation</span>
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#0d3f3a] mt-1.5 truncate">
              {aiHeadline}
            </div>
            <div className="text-xs font-semibold text-emerald-600 mt-1">
              {aiSubtext}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <button
            onClick={onRunSimulation}
            disabled={simulatingDecision}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition transform active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            {simulatingDecision
              ? 'Simulating Digital Twin...'
              : '▶ Run Digital Twin Simulation'}
          </button>

          <button
            onClick={onOpenJudgeMode}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-bold text-sm transition"
          >
            <Film className="h-4 w-4 text-indigo-600" />
            🎬 Demo Mode (30s Guided Tour)
          </button>

          <button
            onClick={onScrollToHowItWorks}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-sm transition"
          >
            <HelpCircle className="h-4 w-4 text-slate-500" />
            View How It Works
          </button>
        </div>
      </div>
    </section>
  );
};

