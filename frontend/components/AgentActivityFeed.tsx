import React, { useState } from 'react';
import {
  ArrowRight,
  Brain,
  Cpu,
  Eye,
  PlayCircle,
  ShieldCheck,
} from 'lucide-react';
import { AgentActivityEvent } from '../services/api';

interface AgentActivityFeedProps {
  events: AgentActivityEvent[];
}

export const AgentActivityFeed: React.FC<AgentActivityFeedProps> = ({
  events,
}) => {
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const filteredEvents =
    filterStage === 'ALL'
      ? events
      : events.filter((e) => e.stage === filterStage);

  const getStageStyle = (stage: AgentActivityEvent['stage']) => {
    switch (stage) {
      case 'PERCEIVE':
        return {
          badge: 'bg-sky-500/15 text-sky-700 border-sky-500/30',
          icon: <Eye className="h-3.5 w-3.5 text-sky-600" />,
          label: 'PERCEIVE',
        };
      case 'WORKLOAD':
        return {
          badge: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30',
          icon: <Cpu className="h-3.5 w-3.5 text-cyan-600" />,
          label: 'PERCEIVE:QUEUE',
        };
      case 'REASON':
        return {
          badge: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
          icon: <Brain className="h-3.5 w-3.5 text-purple-600" />,
          label: 'REASON',
        };
      case 'SAFETY':
        return {
          badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
          icon: <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />,
          label: 'SAFETY CHECK',
        };
      case 'EXECUTE':
        return {
          badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
          icon: <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />,
          label: 'EXECUTE',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm ga-glass-card flex flex-col">
      {/* Header + Interactive Pipeline Filter */}
      <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm sm:text-base font-bold text-[#0d3f3a]">
              Live Multi-Agent Orchestration Stream
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              {filteredEvents.length} EVENTS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter real-time telemetry across the 4-stage autonomous agent pipeline.
          </p>
        </div>

        {/* Visual Pipeline Step Indicator */}
        <div className="p-1.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-wrap items-center gap-1 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setFilterStage('ALL')}
            className={`px-2.5 py-1 rounded-lg transition ${
              filterStage === 'ALL'
                ? 'bg-[#0d3f3a] text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-white'
            }`}
          >
            ALL ({events.length})
          </button>
          <span className="h-3.5 w-px bg-slate-200 mx-0.5" />
          <button
            type="button"
            onClick={() =>
              setFilterStage(filterStage === 'PERCEIVE' ? 'ALL' : 'PERCEIVE')
            }
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
              filterStage === 'PERCEIVE'
                ? 'bg-sky-500/20 text-sky-800 border border-sky-400 font-semibold'
                : 'text-sky-700 hover:bg-white'
            }`}
          >
            <Eye className="h-3 w-3" /> PERCEIVE
          </button>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <button
            type="button"
            onClick={() =>
              setFilterStage(filterStage === 'REASON' ? 'ALL' : 'REASON')
            }
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
              filterStage === 'REASON'
                ? 'bg-purple-500/20 text-purple-800 border border-purple-400 font-semibold'
                : 'text-purple-700 hover:bg-white'
            }`}
          >
            <Brain className="h-3 w-3" /> REASON
          </button>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <button
            type="button"
            onClick={() =>
              setFilterStage(filterStage === 'SAFETY' ? 'ALL' : 'SAFETY')
            }
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
              filterStage === 'SAFETY'
                ? 'bg-amber-500/20 text-amber-800 border border-amber-400 font-semibold'
                : 'text-amber-700 hover:bg-white'
            }`}
          >
            <ShieldCheck className="h-3 w-3" /> SAFETY
          </button>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <button
            type="button"
            onClick={() =>
              setFilterStage(filterStage === 'EXECUTE' ? 'ALL' : 'EXECUTE')
            }
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition ${
              filterStage === 'EXECUTE'
                ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-400 font-semibold'
                : 'text-emerald-700 hover:bg-white'
            }`}
          >
            <PlayCircle className="h-3 w-3" /> EXECUTE
          </button>
        </div>
      </div>

      {/* Scrollable Event List */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[380px]">
        {filteredEvents.map((evt) => {
          const st = getStageStyle(evt.stage);
          return (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/90 hover:border-emerald-300/80 hover:bg-white transition text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {st.icon}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${st.badge}`}
                    >
                      {st.label}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-slate-600">
                      {evt.agent_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                    {evt.job_id && (
                      <span className="px-1.5 py-0.5 rounded bg-white text-[#0d3f3a] font-semibold border border-slate-200">
                        {evt.job_id}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {evt.simulation_time}
                    </span>
                  </div>
                </div>
                <div className="font-semibold text-[#0d3f3a] text-xs">
                  {evt.title}
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed mt-1">
                  {evt.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
