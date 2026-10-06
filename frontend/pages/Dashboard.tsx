import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart2,
  Layers,
  Play,
  Shield,
  Sparkles,
} from 'lucide-react';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { BeforeAfterComparison } from '../components/BeforeAfterComparison';
import { CarbonForecastChart } from '../components/CarbonForecastChart';
import { SafetyAndMcpPanel } from '../components/SafetyAndMcpPanel';
import { SubmitWorkloadModal } from '../components/SubmitWorkloadModal';
import { TopMetricsBar } from '../components/TopMetricsBar';
import { WorkloadTable } from '../components/WorkloadTable';
import { api, DashboardState } from '../services/api';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'comparison' | 'safety_mcp'
  >('overview');
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [bannerNote, setBannerNote] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const state = await api.getDashboard();
      setData(state);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to connect to backend API'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const withBusy = async (fn: () => Promise<void>, note?: string) => {
    setBusy(true);
    try {
      await fn();
      await fetchDashboard();
      if (note) {
        setBannerNote(note);
        setTimeout(() => setBannerNote(null), 6000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <div className="text-sm font-mono text-slate-400">
            Initializing GridAgent-AI Multi-Agent Runtime...
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-lg text-center space-y-3">
          <div className="text-rose-400 font-bold text-lg">
            Backend API Connection Error
          </div>
          <p className="text-xs text-slate-300 font-mono">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-4 space-y-5">
        {/* Top Metrics & Simulation Controls */}
        <TopMetricsBar
          gridStatus={data.grid_status}
          workloads={data.workloads}
          comparison={data.comparison}
          activeProfile={data.active_profile}
          availableProfiles={data.available_profiles}
          busy={busy}
          onStepClock={(hours) =>
            withBusy(
              async () => {
                await api.stepSimulation(hours);
              },
              `Advanced simulation clock by +${hours}h. Evaluated DEFERRED → RUNNING and RUNNING → COMPLETED workload transitions.`
            )
          }
          onSetHour={(hour) =>
            withBusy(
              async () => {
                await api.updateSimulation({ current_hour: hour });
              },
              `Moved simulation clock to ${String(hour).padStart(2, '0')}:00.`
            )
          }
          onChangeProfile={(profile) =>
            withBusy(
              async () => {
                await api.updateSimulation({ profile });
              },
              `Switched 24h grid simulation profile to '${profile}'.`
            )
          }
          onReset={(seedScenario1) =>
            withBusy(
              async () => {
                await api.resetSimulation(seedScenario1);
              },
              'Reset simulation clock to 15:00 and initialized Scenario 1 (AI-TRAINING-001).'
            )
          }
          onRunWalkthrough={() =>
            withBusy(
              async () => {
                await api.runJudgeWalkthrough();
              },
              'Completed Judge Lifecycle Walkthrough: 15:00 Submit (QUEUED → DEFERRED) → 17:00 Clean Window (DEFERRED → RUNNING) → 18:00 (RUNNING → COMPLETED).'
            )
          }
          onOpenSubmitModal={() => setSubmitModalOpen(true)}
        />

        {/* Status Toast / Notification Banner */}
        {bannerNote && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between">
            <span>✓ {bannerNote}</span>
            <button
              onClick={() => setBannerNote(null)}
              className="text-emerald-300 hover:text-white ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {/* 5 Interactive Demonstration Scenarios Bar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-white">
                Interactive Demonstration Scenarios (Click to Execute Live Multi-Agent Flow)
              </span>
            </div>
            <button
              disabled={busy}
              onClick={() =>
                withBusy(
                  async () => {
                    await api.runAllScenarios();
                  },
                  'Executed all 5 canonical demonstration scenarios across PERCEIVE → REASON → SAFETY → EXECUTE.'
                )
              }
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition self-start md:self-auto"
            >
              Run All 5 Demo Scenarios
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {data.demo_scenarios.map((sc) => (
              <button
                key={sc.id}
                disabled={busy}
                onClick={() =>
                  withBusy(
                    async () => {
                      await api.runScenario(sc.id, true);
                    },
                    `Executed ${sc.title}: ${sc.expected_outcome}`
                  )
                }
                className="text-left p-3 rounded-xl bg-slate-950/90 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-300">
                    <span>Scenario {sc.number}</span>
                    <Play className="h-3 w-3 text-slate-500 group-hover:text-emerald-400" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200 mt-0.5">
                    {sc.title.replace(/^Scenario \d+:\s*/, '')}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sc.subtitle}
                  </div>
                </div>
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] font-mono text-emerald-400/90 truncate">
                  {sc.expected_outcome}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation View Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            Orchestrator Dashboard (Forecast, Queue &amp; Live Agents)
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'comparison'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            Before vs After Comparison ({data.comparison.carbon_reduction_percentage}% Carbon Saved)
          </button>

          <button
            onClick={() => setActiveTab('safety_mcp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'safety_mcp'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Shield className="h-4 w-4" />
            Safety Governance Engine &amp; MCP Tool Inspector ({data.mcp_tools.length} Tools)
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Main Visualization (2/3) + Live Agent Activity Feed (1/3) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <CarbonForecastChart
                  forecast={data.forecast_24h}
                  gridStatus={data.grid_status}
                  workloads={data.workloads}
                  onSelectHour={(hour) =>
                    withBusy(
                      async () => {
                        await api.updateSimulation({ current_hour: hour });
                      },
                      `Moved simulation clock to ${String(hour).padStart(2, '0')}:00.`
                    )
                  }
                />
              </div>
              <div className="xl:col-span-1">
                <AgentActivityFeed events={data.agent_events} />
              </div>
            </div>

            {/* Workload Queue & Explainability Table */}
            <WorkloadTable
              workloads={data.workloads}
              busy={busy}
              onAction={(jobId, action) =>
                withBusy(
                  async () => {
                    await api.workloadAction(jobId, action);
                  },
                  `Executed '${action.toUpperCase()}' action on workload ${jobId}.`
                )
              }
            />

            {/* Inline Before vs After Comparison Summary */}
            <BeforeAfterComparison comparison={data.comparison} />
          </div>
        )}

        {activeTab === 'comparison' && (
          <BeforeAfterComparison comparison={data.comparison} />
        )}

        {activeTab === 'safety_mcp' && (
          <SafetyAndMcpPanel
            policyRules={data.policy_rules}
            auditLogs={data.policy_audit_logs}
            mcpTools={data.mcp_tools}
          />
        )}
      </div>

      {/* Submit Custom Workload Modal */}
      <SubmitWorkloadModal
        isOpen={submitModalOpen}
        currentCarbon={data.grid_status.carbon_intensity_gco2_kwh}
        currentSolar={data.grid_status.solar_generation_mw}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitJob={async (payload) => {
          await withBusy(
            async () => {
              await api.submitWorkload(payload);
            },
            `Submitted workload '${payload.name}' and executed PERCEIVE → REASON → SAFETY → EXECUTE.`
          );
        }}
        onOverrideGrid={async (payload) => {
          await withBusy(
            async () => {
              await api.updateSimulation(payload);
            },
            `Applied custom grid telemetry override (${payload.override_current_carbon} gCO₂/kWh).`
          );
        }}
      />
    </div>
  );
};
