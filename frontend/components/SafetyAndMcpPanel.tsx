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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Left: Safety & Governance Policy Engine + Audit Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Safety &amp; Governance Policy Engine (ALLOW / DENY / ASK_USER)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            The AI Reasoning Agent can NEVER override a DENY policy. Every proposed action is validated before execution.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
            <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-2">
              <ShieldAlert className="h-4 w-4" /> DENY (Hard Block)
            </div>
            <ul className="space-y-1 font-mono text-[11px] text-rose-200/90">
              {policyRules.DENY.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-4 w-4" /> ALLOW (Autonomous)
            </div>
            <ul className="space-y-1 font-mono text-[11px] text-emerald-200/90">
              {policyRules.ALLOW.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-2">
              <AlertTriangle className="h-4 w-4" /> ASK_USER (Approval)
            </div>
            <ul className="space-y-1 font-mono text-[11px] text-amber-200/90">
              {policyRules.ASK_USER.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Policy Audit Log Table */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            SQLite Governance Policy Audit Trail ({auditLogs.length} entries)
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-white">
                    {log.job_id} ({log.workload_type})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      log.policy_decision === 'ALLOW'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : log.policy_decision === 'DENY'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {log.policy_decision}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Rule: {log.rule_matched}
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  {log.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Live MCP Server Tool Inspector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-sky-400" />
            Model Context Protocol (MCP) Tool Inspector
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test any registered MCP tool directly against the backend perception, optimization, safety, and execution layers.
          </p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              Select MCP Tool ({mcpTools.length} available):
            </label>
            <select
              value={selectedTool}
              onChange={(e) => handleSelectTool(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-sky-500"
            >
              {mcpTools.map((t) => (
                <option key={t.name} value={t.name}>
                  [{t.category}] {t.name}() — {t.description.slice(0, 65)}...
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              JSON Arguments Payload:
            </label>
            <textarea
              rows={5}
              value={toolArgsJson}
              onChange={(e) => setToolArgsJson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            onClick={handleInvokeTool}
            disabled={callingTool}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            {callingTool ? 'Executing MCP Tool...' : `Execute ${selectedTool}()`}
          </button>

          {toolResponse && (
            <div>
              <div className="text-slate-400 mb-1 font-medium">
                MCP Tool Response:
              </div>
              <pre className="max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-sky-300">
                {toolResponse}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
