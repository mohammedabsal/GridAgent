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
          badge: 'bg-sky-500/20 text-sky-600 border-sky-500/30',
          icon: <Eye className="h-3.5 w-3.5 text-sky-600" />,
          label: '[PERCEIVE]',
        };
      case 'WORKLOAD':
        return {
          badge: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30',
          icon: <Cpu className="h-3.5 w-3.5 text-cyan-600" />,
          label: '[PERCEIVE:QUEUE]',
        };
      case 'REASON':
        return {
          badge: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
          icon: <Brain className="h-3.5 w-3.5 text-purple-600" />,
          label: '[REASON]',
        };
      case 'SAFETY':
        return {
          badge: 'bg-amber-500/20 text-amber-600 border-amber-500/30',
          icon: <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />,
          label: '[SAFETY]',
        };
      case 'EXECUTE':
        return {
          badge: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
          icon: <PlayCircle className="h-3.5 w-3.5 text-emerald-600" />,
          label: '[EXECUTE]',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base sm:text-lg font-bold text-[#0d3f3a]">
            Live Multi-Agent Activity Stream
          </h2>
          <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            ACTIVE
          </span>
        </div>

        {/* Visual Pipeline Step Indicator */}
        <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
          <button
            onClick={() =>
              setFilterStage(filterStage === 'PERCEIVE' ? 'ALL' : 'PERCEIVE')
            }
            className={`px-2 py-1 rounded flex items-center gap-1 transition ${
              filterStage === 'PERCEIVE'
                ? 'bg-sky-500/30 text-sky-700 border border-sky-400'
                : 'text-sky-600 hover:bg-slate-50'
            }`}
          >
            <Eye className="h-3 w-3" /> PERCEIVE
          </button>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <button
            onClick={() =>
              setFilterStage(filterStage === 'REASON' ? 'ALL' : 'REASON')
            }
            className={`px-2 py-1 rounded flex items-center gap-1 transition ${
              filterStage === 'REASON'
                ? 'bg-purple-500/30 text-purple-700 border border-purple-400'
                : 'text-purple-600 hover:bg-slate-50'
            }`}
          >
            <Brain className="h-3 w-3" /> REASON
          </button>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <button
            onClick={() =>
              setFilterStage(filterStage === 'SAFETY' ? 'ALL' : 'SAFETY')
            }
            className={`px-2 py-1 rounded flex items-center gap-1 transition ${
              filterStage === 'SAFETY'
                ? 'bg-amber-500/30 text-amber-700 border border-amber-400'
                : 'text-amber-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="h-3 w-3" /> SAFETY CHECK
          </button>
          <ArrowRight className="h-3 w-3 text-slate-600" />
          <button
            onClick={() =>
              setFilterStage(filterStage === 'EXECUTE' ? 'ALL' : 'EXECUTE')
            }
            className={`px-2 py-1 rounded flex items-center gap-1 transition ${
              filterStage === 'EXECUTE'
                ? 'bg-emerald-500/30 text-emerald-700 border border-emerald-400'
                : 'text-emerald-600 hover:bg-slate-50'
            }`}
          >
            <PlayCircle className="h-3 w-3" /> EXECUTE
          </button>
        </div>
      </div>

      {/* Scrollable Event List */}
      <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
        {filteredEvents.map((evt) => {
          const st = getStageStyle(evt.stage);
          return (
            <div
              key={evt.id}
              className="p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition text-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  {st.icon}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${st.badge}`}
                  >
                    {st.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {evt.agent_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                  {evt.job_id && (
                    <span className="px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                      {evt.job_id}
                    </span>
                  )}
                  <span>Sim {evt.simulation_time}</span>
                </div>
              </div>
              <div className="font-semibold text-[#0d3f3a]">{evt.title}</div>
              <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5">
                {evt.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
