import React from 'react';
import {
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SimulationControlBarProps {
  currentHour: number;
  currentTime: string;
  isPlaying: boolean;
  speed: 1 | 2 | 5;
  busy: boolean;
  simulatingDecision: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepHour: (delta: number) => void;
  onSetSpeed: (speed: 1 | 2 | 5) => void;
  onSimulateDecision: () => void;
}

export const SimulationControlBar: React.FC<SimulationControlBarProps> = ({
  currentHour,
  currentTime,
  isPlaying,
  speed,
  busy,
  simulatingDecision,
  onTogglePlay,
  onReset,
  onStepHour,
  onSetSpeed,
  onSimulateDecision,
}) => {
  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-700/80 bg-slate-950/90 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/80 pointer-events-auto flex flex-wrap items-center justify-between gap-3">
        {/* Label + Play/Pause/Reset */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 mr-1">
            Digital Twin Simulation
          </span>

          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
              isPlaying
                ? 'bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" /> PAUSE
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" /> PLAY
              </>
            )}
          </button>

          <button
            onClick={onReset}
            disabled={busy}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> RESET
          </button>
        </div>

        {/* Simulation Time + -1h / +1h */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onStepHour(-1)}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 transition"
          >
            - 1 HOUR
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-slate-400">Time:</span>
            <span className="text-sm font-mono font-extrabold text-white">
              {currentTime}
            </span>
          </div>

          <button
            onClick={() => onStepHour(1)}
            disabled={busy}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-300 transition"
          >
            + 1 HOUR
          </button>
        </div>

        {/* Speed Selector + Simulate AI Decision */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-xs font-mono">
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-1 rounded-lg transition ${
                  speed === s
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={onSimulateDecision}
            disabled={simulatingDecision}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            {simulatingDecision ? 'Simulating...' : 'Simulate AI Decision'}
          </button>
        </div>
      </div>
    </div>
  );
};

