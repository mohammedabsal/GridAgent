import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  ShieldAlert,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { api, MCPToolSchema, PolicyAuditLog } from '../services/api';

interface SafetyAndMcpPanelProps {
  policyRules: {
    DENY: string[];
    ALLOW: string[];
    ASK_USER: string[];
  };
  auditLogs: PolicyAuditLog[];
  mcpTools: MCPToolSchema[];
}

const formatRuleLabel = (raw: string): string => {
  if (raw.includes('>') || raw.includes('<')) return raw;
  return raw
    .split('_')
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
};

const QUICK_MCP_PRESETS: { label: string; tool: string }[] = [
  { label: 'Grid Status', tool: 'get_current_grid_status' },
  { label: '24h Forecast', tool: 'get_grid_forecast' },
  { label: 'Optimal Window', tool: 'find_optimal_execution_window' },
  { label: 'Policy Check', tool: 'check_execution_policy' },
  { label: 'Workload Queue', tool: 'get_workload_queue' },
];

export const SafetyAndMcpPanel: React.FC<SafetyAndMcpPanelProps> = ({
  policyRules,
  auditLogs,
  mcpTools,
}) => {
  const [selectedTool, setSelectedTool] = useState<string>(
    'get_current_grid_status'
  );
  const [toolArgsJson, setToolArgsJson] = useState<string>('{}');
  const [toolResponse, setToolResponse] = useState<string>('');
  const [callingTool, setCallingTool] = useState<boolean>(false);

  const selectedToolSchema = mcpTools.find((t) => t.name === selectedTool);

  const handleSelectTool = (name: string) => {
    setSelectedTool(name);
    if (name === 'get_workload_details' || name === 'get_job_details') {
      setToolArgsJson(JSON.stringify({ job_id: 'AI-TRAINING-001' }, null, 2));
    } else if (name === 'find_optimal_execution_window') {
      setToolArgsJson(
        JSON.stringify(
          {
            current_time: '15:00',
            current_carbon_intensity: 700,
            forecasted_carbon_intensity: [
              { hour: 15, carbon_intensity_gco2_kwh: 700 },
              { hour: 16, carbon_intensity_gco2_kwh: 450 },
              { hour: 17, carbon_intensity_gco2_kwh: 390 },
              { hour: 18, carbon_intensity_gco2_kwh: 420 },
              { hour: 19, carbon_intensity_gco2_kwh: 650 },
            ],
            job_duration_minutes: 60,
            job_deadline: '20:00',
            job_energy_kwh: 150,
            job_priority: 'MEDIUM',
          },
          null,
          2
        )
      );
    } else if (name === 'check_execution_policy') {
      setToolArgsJson(
        JSON.stringify(
          {
            job_id: 'PROD-WEB-003',
            workload_type: 'production_web_server',
            proposed_decision: 'DEFER',
          },
          null,
          2
        )
      );
    } else {
      setToolArgsJson('{}');
    }
  };

  const handleInvokeTool = async () => {
    setCallingTool(true);
    try {
      const parsedArgs = JSON.parse(toolArgsJson || '{}');
      const res = await api.callMcpTool(selectedTool, parsedArgs);
      setToolResponse(JSON.stringify(res, null, 2));
    } catch (err) {
      setToolResponse(
        `Error invoking MCP tool: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    } finally {
      setCallingTool(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Left (7 cols): Safety & Governance Policy Engine + SQLite Audit Trail */}
      <div className="xl:col-span-7 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm ga-glass-card flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50/40 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700 border border-emerald-500/25">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#0d3f3a]">
                  Safety &amp; Governance Policy Engine
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Deterministic policy gate between AI reasoning and infrastructure execution. The AI Reasoning Agent can <strong className="text-[#0d3f3a]">never override a DENY policy</strong>.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                DENY ({policyRules.DENY.length})
              </span>
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                ALLOW ({policyRules.ALLOW.length})
              </span>
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                ASK_USER ({policyRules.ASK_USER.length})
              </span>
            </div>
          </div>

          {/* 3 Policy Tiers — Responsive, zero text clipping */}
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* DENY Tier */}
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-rose-200/70">
                  <span className="font-bold text-rose-700 flex items-center gap-1.5 text-xs">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    DENY
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-semibold">
                    Hard Block
                  </span>
                </div>
                <p className="text-[11px] text-rose-800/80 mb-2.5 leading-snug">
                  Protected production services; always execute immediately without deferral.
                </p>
                <div className="flex flex-col gap-1.5">
                  {policyRules.DENY.map((item) => (
                    <div
                      key={item}
                      className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-rose-200/80 shadow-2xs"
                    >
                      <div className="text-[11px] font-semibold text-rose-900 leading-tight">
                        {formatRuleLabel(item)}
                      </div>
                      <div className="text-[10px] font-mono text-rose-600/90 break-all mt-0.5">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ALLOW Tier */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-emerald-200/70">
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ALLOW
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    Autonomous
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900/75 mb-2.5 leading-snug">
                  Flexible batch &amp; AI training workloads eligible for automatic clean-window shifting.
                </p>
                <div className="flex flex-col gap-1.5">
                  {policyRules.ALLOW.map((item) => (
                    <div
                      key={item}
                      className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-emerald-200/80 shadow-2xs"
                    >
                      <div className="text-[11px] font-semibold text-[#0d3f3a] leading-tight">
                        {formatRuleLabel(item)}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700/90 break-all mt-0.5">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ASK_USER Tier */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/90 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-amber-200/70">
                  <span className="font-bold text-amber-800 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    ASK_USER
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                    Human Gate
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/75 mb-2.5 leading-snug">
                  High-energy, high-cost, or tight-SLA workloads requiring operator sign-off.
                </p>
                <div className="flex flex-col gap-1.5">
                  {policyRules.ASK_USER.map((item) => (
                    <div
                      key={item}
                      className="px-2.5 py-1.5 rounded-lg bg-white/90 border border-amber-200/80 shadow-2xs"
                    >
                      <div className="text-[11px] font-semibold text-amber-950 leading-tight">
                        {formatRuleLabel(item)}
                      </div>
                      <div className="text-[10px] font-mono text-amber-700 break-all mt-0.5">
                        {item}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SQLite Governance Policy Audit Trail */}
        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-slate-500">
              SQLite Governance Policy Audit Trail
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
              {auditLogs.length} {auditLogs.length === 1 ? 'entry' : 'entries'} logged
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/90 text-xs transition hover:border-slate-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#0d3f3a]">
                      {log.job_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-[10px] text-slate-600">
                      {log.workload_type}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${
                      log.policy_decision === 'ALLOW'
                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                        : log.policy_decision === 'DENY'
                        ? 'bg-rose-500/15 text-rose-700 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                    }`}
                  >
                    {log.policy_decision}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  Matched Rule: <span className="text-[#0d3f3a] font-semibold">{log.rule_matched}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {log.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right (5 cols): Live MCP Server Tool Inspector */}
      <div className="xl:col-span-5 bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm ga-glass-card flex flex-col justify-between">
        <div>
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-700 border border-sky-500/25">
                  <Terminal className="h-4 w-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#0d3f3a]">
                  Model Context Protocol (MCP) Inspector
                </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Invoke registered MCP tools directly against the live perception, optimization, safety, and cloud runtime layers.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[10px] font-mono font-semibold text-sky-700">
              {mcpTools.length} MCP Tools
            </span>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Quick Preset Pills */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Quick-Load Tool Presets
              </div>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_MCP_PRESETS.map((preset) => {
                  const active = selectedTool === preset.tool;
                  return (
                    <button
                      key={preset.tool}
                      type="button"
                      onClick={() => handleSelectTool(preset.tool)}
                      className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border transition ${
                        active
                          ? 'bg-[#0d3f3a] text-white border-[#0d3f3a] font-semibold shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-[#0d3f3a]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Tool Selector */}
            <div>
              <label
                htmlFor="mcp-tool-select"
                className="block text-slate-600 mb-1.5 font-semibold"
              >
                Select MCP Tool ({mcpTools.length} registered):
              </label>
              <select
                id="mcp-tool-select"
                value={selectedTool}
                onChange={(e) => handleSelectTool(e.target.value)}
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-xs text-[#0d3f3a] focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              >
                {mcpTools.map((t) => (
                  <option key={t.name} value={t.name}>
                    [{t.category}] {t.name}()
                  </option>
                ))}
              </select>

              {/* Selected Tool Metadata Card */}
              {selectedToolSchema && (
                <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2">
                  <div className="text-[11px] text-slate-600 leading-snug">
                    <span className="font-mono font-semibold text-[#0d3f3a]">
                      {selectedToolSchema.name}()
                    </span>{' '}
                    — {selectedToolSchema.description}
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-mono text-[10px] font-semibold text-emerald-700">
                    {selectedToolSchema.category}
                  </span>
                </div>
              )}
            </div>

            {/* JSON Arguments Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="mcp-json-input"
                  className="text-slate-600 font-semibold"
                >
                  JSON Arguments Payload:
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  application/json
                </span>
              </div>
              <textarea
                id="mcp-json-input"
                rows={5}
                value={toolArgsJson}
                onChange={(e) => setToolArgsJson(e.target.value)}
                className="w-full bg-[#0b2724] border border-emerald-900/60 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-400 shadow-inner"
              />
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleInvokeTool}
                disabled={callingTool}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-mono font-bold text-xs transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                {callingTool
                  ? 'Executing MCP Tool...'
                  : `Execute ${selectedTool}()`}
              </button>
              <span className="text-[11px] font-mono text-slate-400">
                POST /api/mcp/call
              </span>
            </div>

            {/* Live Response Console */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-600 font-semibold">
                  MCP Tool Response:
                </span>
                {toolResponse && (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-semibold text-emerald-700">
                    ● 200 OK
                  </span>
                )}
              </div>
              <pre className="max-h-56 overflow-y-auto p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 leading-relaxed shadow-inner">
                {toolResponse ||
                  `// Click "Execute ${selectedTool}()" above to inspect live MCP output...`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
