import React from 'react';
import type { DashboardState } from '../services/api';
import { JuryEmptyState } from './JuryEmptyState';

interface Props {
  data: DashboardState;
  selectedJobId: string;
  busy: boolean;
  onSelect: (id: string) => void;
  onAction: (jobId: string, action: string, recommendedStartTime?: string) => void;
}

export const SafetyExtraPanels: React.FC<Props> = ({ data, selectedJobId, busy, onSelect, onAction }) => {
  const pending = data.workloads.filter((w) => w.status === 'AWAITING_APPROVAL');
  return (
    <div className="lg:col-span-7 space-y-5">
      <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">Approvals inbox</h2>
          <span className="text-[11px] font-mono text-slate-500">{pending.length} pending</span>
        </div>
        <div className="divide-y divide-slate-100">
          {pending.length === 0 && (
            <JuryEmptyState title="All clear ✓" hint="No workloads waiting for approval — high-cost jobs will appear here." />
          )}
          {pending.map((w) => (
            <div key={w.job_id} className={`px-5 py-3 flex flex-wrap items-center gap-3 ${w.job_id === selectedJobId ? 'bg-amber-50/60' : ''}`}>
              <button onClick={() => onSelect(w.job_id)} className="text-left flex-1 min-w-[180px] hover:underline">
                <div className="text-xs font-bold text-[#0d3f3a] font-mono">{w.job_id}</div>
                <div className="text-[11px] text-slate-500">{w.name} · {w.energy_kwh} kWh · SLA {w.deadline}</div>
              </button>
              <span className="text-[11px] font-mono text-[#F59E0B]">→ {w.recommended_start_time || w.submitted_at_time}</span>
              <div className="flex gap-2">
                <button disabled={busy} onClick={() => { onSelect(w.job_id); onAction(w.job_id, 'approve'); }} className="px-3 py-1.5 rounded-xl bg-[#10B981] hover:bg-[#0da271] text-white text-xs font-bold transition disabled:opacity-50">Approve</button>
                <button disabled={busy} onClick={() => { onSelect(w.job_id); onAction(w.job_id, 'reject'); }} className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-[#EF4444] hover:text-[#EF4444] text-xs font-bold transition disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">Policy rules</h2>
          <span className="text-[11px] font-mono text-slate-500">ALLOW · ASK_USER · DENY</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-5 text-xs">
          <div className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/5 p-3 min-w-0">
            <div className="font-mono font-bold text-[#10B981] mb-1.5">ALLOW ({data.policy_rules.ALLOW.length})</div>
            <ul className="space-y-1.5 text-slate-600 leading-snug">{data.policy_rules.ALLOW.map((r) => (<li key={r} className="break-all font-mono text-[11px]">· {r}</li>))}</ul>
          </div>
          <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-3 min-w-0">
            <div className="font-mono font-bold text-[#F59E0B] mb-1.5">ASK_USER ({data.policy_rules.ASK_USER.length})</div>
            <ul className="space-y-1.5 text-slate-600 leading-snug">{data.policy_rules.ASK_USER.map((r) => (<li key={r} className="break-all font-mono text-[11px]">· {r}</li>))}</ul>
          </div>
          <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/5 p-3 min-w-0">
            <div className="font-mono font-bold text-[#EF4444] mb-1.5">DENY ({data.policy_rules.DENY.length})</div>
            <ul className="space-y-1.5 text-slate-600 leading-snug">{data.policy_rules.DENY.map((r) => (<li key={r} className="break-all font-mono text-[11px]">· {r}</li>))}</ul>
          </div>
        </div>
      </div>
      <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">Audit trail</h2>
          <span className="text-[11px] font-mono text-slate-500">{data.policy_audit_logs.length} rulings</span>
        </div>
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {data.policy_audit_logs.slice(0, 8).map((log) => (
            <div key={log.id} className="px-5 py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-mono font-bold text-[#0d3f3a]">{log.job_id} <span className="text-slate-500 font-normal">· {log.timestamp}</span></div>
                <div className="text-[11px] text-slate-500 truncate">{log.rule_matched} — {log.reason}</div>
              </div>
              <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${log.policy_decision === 'ALLOW' ? 'bg-[#10B981]/15 text-[#10B981]' : log.policy_decision === 'DENY' ? 'bg-[#EF4444]/15 text-[#EF4444]' : 'bg-[#F59E0B]/15 text-[#F59E0B]'}`}>{log.policy_decision}</span>
            </div>
          ))}
          {data.policy_audit_logs.length === 0 && (<JuryEmptyState title="No rulings yet" hint="Run orchestration to generate audit entries." />)}
        </div>
      </div>
    </div>
  );
};
