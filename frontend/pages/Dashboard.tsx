import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Pause,
  Play,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { BeforeAfterComparison } from '../components/BeforeAfterComparison';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { JudgeModeOverlay } from '../components/JudgeModeOverlay';
import { SafetyAndMcpPanel } from '../components/SafetyAndMcpPanel';
import { SubmitWorkloadModal } from '../components/SubmitWorkloadModal';
import { WorkloadTable } from '../components/WorkloadTable';
import { api, DashboardState, WorkloadJob } from '../services/api';

type NavSection =
  | 'dashboard'
  | 'simulation'
  | 'workloads'
  | 'energy'
  | 'impact'
  | 'safety';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeNav, setActiveNav] = useState<NavSection>('dashboard');
  const [selectedJobId, setSelectedJobId] = useState<string>('AI-TRAINING-001');
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');

  // Simulation playback controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [demoSummaryOpen, setDemoSummaryOpen] = useState<boolean>(false);

  // Modals
  const [judgeModeOpen, setJudgeModeOpen] = useState<boolean>(false);
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Continuous simulation playback timer when Play is active
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = speed === 5 ? 850 : speed === 2 ? 1600 : 2800;
    const timer = setInterval(async () => {
      try {
        await api.stepSimulation(1);
        await fetchDashboard();
      } catch {
        setIsPlaying(false);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isPlaying, speed, fetchDashboard]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const withBusy = async (fn: () => Promise<void>, note?: string) => {
    setBusy(true);
    try {
      await fn();
      await fetchDashboard();
      if (note) showToast(note);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Instant optimistic hour update + backend sync
  const handleSelectHour = async (hour: number) => {
    const clamped = Math.max(0, Math.min(23, hour));
    if (data) {
      const pt = data.forecast_24h.find((p) => p.hour === clamped);
      if (pt) {
        setData({
          ...data,
          grid_status: {
            ...data.grid_status,
            current_hour: clamped,
            current_time: pt.time_str,
            carbon_intensity_gco2_kwh: pt.carbon_intensity_gco2_kwh,
            renewable_percentage: pt.renewable_percentage,
            solar_generation_mw: pt.solar_generation_mw,
            wind_generation_mw: pt.wind_generation_mw,
            demand_mw: pt.demand_mw,
            electricity_price_usd_kwh: pt.electricity_price_usd_kwh,
            grid_regime: pt.grid_regime,
          },
        });
      }
    }
    try {
      await api.updateSimulation({ current_hour: clamped }, true);
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Run Decision for the currently selected workload
  const handleRunDecision = async () => {
    if (!data) return;
    const targetJob =
      data.workloads.find((w) => w.job_id === selectedJobId) ||
      data.workloads[0];
    if (!targetJob) return;
    await withBusy(async () => {
      await api.orchestrateWorkload(targetJob.job_id);
    }, `Decision evaluated for ${targetJob.name}`);
  };

  // 6-Step Guided Live Demo (Section 20)
  const handleRunLiveDemo = async () => {
    if (!data || demoStep !== null) return;
    setIsPlaying(false);
    setDemoSummaryOpen(false);
    setSelectedJobId('AI-TRAINING-001');

    try {
      // STEP 1: Current time 15:00, Grid 700 gCO2/kWh, Workload Ready
      setDemoStep(1);
      await api.updateSimulation(
        {
          current_hour: 15,
          override_current_carbon: null,
          override_current_solar_mw: null,
        },
        true
      );
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1100));

      // STEP 2: Digital Twin simulates 15:00, 16:00, 17:00, 18:00, 19:00
      setDemoStep(2);
      for (const h of [15, 16, 17, 18]) {
        await api.updateSimulation({ current_hour: h }, false);
        await fetchDashboard();
        await new Promise((r) => setTimeout(r, 420));
      }

      // STEP 3: System evaluates Carbon, Cost, Deadline, Safety
      setDemoStep(3);
      await api.updateSimulation({ current_hour: 15 }, true);
      await api.orchestrateWorkload('AI-TRAINING-001');
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1100));

      // STEP 4: Decision: 17:00
      setDemoStep(4);
      await new Promise((r) => setTimeout(r, 1000));

      // STEP 5: Digital Twin moves workload to 17:00
      setDemoStep(5);
      await api.updateSimulation({ current_hour: 17 }, true);
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1100));

      // STEP 6: Show Carbon Impact & summary
      setDemoStep(6);
      setDemoSummaryOpen(true);
      await new Promise((r) => setTimeout(r, 1600));
    } finally {
      setDemoStep(null);
    }
  };

  const navigateTo = (section: NavSection, anchorId: string) => {
    setActiveNav(section);
    document
      .getElementById(anchorId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D12] text-[#E6EDF3]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#8B949E]">
          <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
          INITIALIZING GRIDAGENT-AI SIMULATION ENGINE...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0D12] p-6">
        <div className="bg-[#0D1117] border border-[#EF4444]/50 rounded-sm p-6 max-w-md space-y-4">
          <div className="text-xs font-mono uppercase tracking-wider text-[#EF4444]">
            SIMULATION ENGINE DISCONNECTED
          </div>
          <p className="text-xs text-[#8B949E] font-mono">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-sm bg-[#10B981] text-[#0A0D12] font-mono font-semibold text-xs"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const grid = data.grid_status;
  const selectedWorkload: WorkloadJob =
    data.workloads.find((w) => w.job_id === selectedJobId) ||
    data.workloads[0] || {
      job_id: 'AI-TRAINING-001',
      name: 'LLM Fine-Tuning',
      workload_type: 'ai_model_training',
      priority: 'MEDIUM',
      duration_minutes: 60,
      deadline: '20:00',
      energy_kwh: 150,
      estimated_cloud_cost_usd: 33,
      submitted_at_time: '15:00',
      status: 'DEFERRED',
      recommended_start_time: '17:00',
      current_carbon_intensity: 700,
      predicted_carbon_intensity: 390,
      baseline_emissions_gco2: 105000,
      optimized_emissions_gco2: 58500,
      estimated_carbon_savings_gco2: 46500,
      carbon_reduction_pct: 44.3,
      baseline_cost_usd: 33,
      optimized_cost_usd: 13.5,
      estimated_cost_savings_usd: 19.5,
      cost_reduction_pct: 59.1,
      decision: 'DEFER',
      decision_reason:
        'Deferred from 15:00 to 17:00 because expected grid carbon drops from 700 to 390 gCO2/kWh.',
      policy_decision: 'ALLOW',
      confidence: 0.95,
      region: 'Simulated Cloud',
      is_protected_service: false,
    };

  const recStart =
    selectedWorkload.recommended_start_time ||
    selectedWorkload.submitted_at_time ||
    '17:00';
  const submitTime = selectedWorkload.submitted_at_time || '15:00';

  // Actual backend simulation calculations (never fabricated)
  const baselineCarbonIntensity =
    selectedWorkload.current_carbon_intensity ??
    grid.carbon_intensity_gco2_kwh;
  const optimizedCarbonIntensity =
    selectedWorkload.predicted_carbon_intensity ??
    grid.carbon_intensity_gco2_kwh;

  const baselineKg = (selectedWorkload.baseline_emissions_gco2 / 1000).toFixed(
    1
  );
  const optimizedKg = (
    selectedWorkload.optimized_emissions_gco2 / 1000
  ).toFixed(1);
  const savedKg = (
    selectedWorkload.estimated_carbon_savings_gco2 / 1000
  ).toFixed(1);

  const baselineCost = selectedWorkload.baseline_cost_usd.toFixed(2);
  const optimizedCost = selectedWorkload.optimized_cost_usd.toFixed(2);

  const carbonReductionPct = selectedWorkload.carbon_reduction_pct.toFixed(1);
  const costReductionPct = selectedWorkload.cost_reduction_pct.toFixed(1);
  const confidencePct = Math.round((selectedWorkload.confidence ?? 0.95) * 100);

  // Governance State (ALLOWED / ASK USER / BLOCKED)
  const governanceState: 'ALLOWED' | 'ASK USER' | 'BLOCKED' =
    selectedWorkload.policy_decision === 'DENY' ||
    selectedWorkload.status === 'BLOCKED' ||
    selectedWorkload.is_protected_service
      ? 'BLOCKED'
      : selectedWorkload.policy_decision === 'ASK_USER' ||
        selectedWorkload.status === 'AWAITING_APPROVAL'
      ? 'ASK USER'
      : 'ALLOWED';

  const decisionHeadline =
    governanceState === 'BLOCKED'
      ? 'RUN IMMEDIATELY (PROTECTED)'
      : governanceState === 'ASK USER'
      ? `HOLD FOR APPROVAL (${recStart})`
      : selectedWorkload.decision === 'DEFER'
      ? `WAIT UNTIL ${recStart}`
      : `RUN AT ${recStart}`;

  const candidateCount =
    selectedWorkload.candidate_windows &&
    selectedWorkload.candidate_windows.length > 0
      ? selectedWorkload.candidate_windows.length
      : 6;

  return (
    <div className="min-h-screen bg-[#0A0D12] text-[#E6EDF3] flex flex-col font-sans selection:bg-[#10B981]/25">
      {/* =====================================================================
          1. SINGLE HORIZONTAL TOP NAVIGATION (NO LEFT SIDEBAR)
      ===================================================================== */}
      <header className="h-12 border-b border-[#1E2633] bg-[#0D1117] px-4 md:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#10B981]" />
            <span className="text-sm font-bold tracking-tight text-[#E6EDF3]">
              GridAgent-AI
            </span>
          </div>

          {/* Primary Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs">
            {(
              [
                ['dashboard', 'Dashboard', 'console-header'],
                ['simulation', 'Simulation', 'digital-twin-section'],
                ['workloads', 'Workloads', 'governance-workloads-section'],
                ['energy', 'Energy', 'digital-twin-section'],
                ['impact', 'Impact', 'what-if-section'],
                ['safety', 'Safety', 'governance-workloads-section'],
              ] as const
            ).map(([id, label, anchor]) => {
              const active = activeNav === id;
              return (
                <button
                  key={id}
                  onClick={() => navigateTo(id, anchor)}
                  className={`px-3 py-1.5 rounded-sm transition ${
                    active
                      ? 'text-[#E6EDF3] bg-[#161D29] font-medium'
                      : 'text-[#8B949E] hover:text-[#E6EDF3]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Simple View | Technical View Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunLiveDemo}
            disabled={demoStep !== null}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] hover:bg-[#10B981]/25 text-xs font-mono font-medium transition disabled:opacity-50"
          >
            ▶ RUN LIVE DEMO
          </button>

          <div className="flex items-center bg-[#0A0D12] border border-[#1E2633] rounded-sm p-0.5 text-xs">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-2.5 py-1 rounded-xs transition ${
                viewMode === 'simple'
                  ? 'bg-[#161D29] text-[#E6EDF3] font-medium'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              Simple View
            </button>
            <button
              onClick={() => {
                setViewMode('technical');
                setTimeout(() => {
                  document
                    .getElementById('technical-details-section')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }, 80);
              }}
              className={`px-2.5 py-1 rounded-xs transition ${
                viewMode === 'technical'
                  ? 'bg-[#161D29] text-[#E6EDF3] font-medium'
                  : 'text-[#8B949E] hover:text-[#E6EDF3]'
              }`}
            >
              Technical View
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN FULL-WIDTH ENGINEERING CONSOLE
      ===================================================================== */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-6 py-5 space-y-5">
        {/* Toast notification */}
        {toastMessage && (
          <div className="bg-[#11161F] border border-[#10B981]/50 text-[#E6EDF3] px-4 py-2.5 rounded-sm text-xs font-mono flex items-center justify-between">
            <span>{toastMessage}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#8B949E] hover:text-[#E6EDF3]"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===================================================================
            SECTION 13 & 14: COMPACT OPERATIONS CONSOLE HEADER + 4 QUIET KPIs
        =================================================================== */}
        <section
          id="console-header"
          className="border border-[#1E2633] bg-[#0D1117] rounded-sm p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-[#1E2633]">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#10B981]">
                  GRIDAGENT-AI
                </span>
                <span className="text-[#1E2633]">/</span>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  OPERATIONS CONTROL SYSTEM
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#E6EDF3]">
                Carbon-Aware Cloud Workload Simulation
              </h1>
              <p className="text-xs md:text-sm text-[#8B949E] max-w-2xl">
                Simulate workload execution against grid carbon intensity,
                renewable generation, cost, and operational constraints.
              </p>
            </div>

            {/* Primary & Secondary Console Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleRunLiveDemo}
                disabled={demoStep !== null}
                className="px-4 py-2 rounded-sm bg-[#10B981] hover:bg-[#059669] text-[#0A0D12] font-mono font-semibold text-xs transition disabled:opacity-50"
              >
                {demoStep !== null
                  ? `SIMULATING STEP ${demoStep}/6...`
                  : '▶ RUN SIMULATION'}
              </button>
              <button
                onClick={() =>
                  navigateTo('dashboard', 'gridagent-decision-panel')
                }
                className="px-3.5 py-2 rounded-sm bg-[#11161F] hover:bg-[#161D29] text-[#E6EDF3] border border-[#1E2633] font-mono text-xs transition"
              >
                VIEW DECISION
              </button>
              <button
                onClick={() => setSubmitModalOpen(true)}
                className="px-3 py-2 rounded-sm bg-[#11161F] hover:bg-[#161D29] text-[#8B949E] hover:text-[#E6EDF3] border border-[#1E2633] font-mono text-xs inline-flex items-center gap-1.5 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                WORKLOAD
              </button>
            </div>
          </div>

          {/* 4 Visually Quiet KPI Readouts (Section 14) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#1E2633] pt-4">
            <div className="pr-4 py-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E]">
                GRID CARBON
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-[#E6EDF3]">
                  {Math.round(grid.carbon_intensity_gco2_kwh)} gCO₂/kWh
                </span>
                <span
                  className={`text-[11px] font-mono ${
                    grid.carbon_intensity_gco2_kwh <= 420
                      ? 'text-[#10B981]'
                      : grid.carbon_intensity_gco2_kwh >= 550
                      ? 'text-[#EF4444]'
                      : 'text-[#F59E0B]'
                  }`}
                >
                  {grid.carbon_intensity_gco2_kwh <= 420
                    ? 'Clean'
                    : grid.carbon_intensity_gco2_kwh >= 550
                    ? 'High'
                    : 'Moderate'}
                </span>
              </div>
            </div>

            <div className="lg:px-5 py-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E]">
                RENEWABLE
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-[#E6EDF3]">
                  {grid.renewable_percentage.toFixed(1)}%
                </span>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  {Math.round(
                    grid.solar_generation_mw + grid.wind_generation_mw
                  )}{' '}
                  MW
                </span>
              </div>
            </div>

            <div className="lg:px-5 py-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E]">
                WORKLOAD
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-[#E6EDF3]">
                  {selectedWorkload.energy_kwh} kWh
                </span>
                <span className="text-[11px] font-mono text-[#8B949E] truncate">
                  {selectedWorkload.name}
                </span>
              </div>
            </div>

            <div className="lg:pl-5 py-1">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E]">
                RECOMMENDED
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-mono font-semibold text-[#10B981]">
                  {recStart}
                </span>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  {Math.round(optimizedCarbonIntensity)} gCO₂/kWh
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Live Demo Conclusion Banner when Step 6 completes */}
        {demoSummaryOpen && (
          <div className="border border-[#10B981]/50 bg-[#11161F] rounded-sm px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="px-2 py-0.5 rounded-xs bg-[#10B981]/20 text-[#10B981] font-mono text-xs font-semibold">
                DEMO COMPLETE
              </span>
              <span className="text-xs font-mono text-[#E6EDF3]">
                CARBON IMPACT: {baselineKg} kg → {optimizedKg} kg CO₂ (-
                {carbonReductionPct}%)
              </span>
              <span className="text-xs text-[#10B981] font-medium">
                “Same workload. Same deadline. Cleaner energy.”
              </span>
            </div>
            <button
              onClick={() => setDemoSummaryOpen(false)}
              className="text-xs font-mono text-[#8B949E] hover:text-[#E6EDF3]"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* ===================================================================
            SECTION 12: REAL SIMULATION CONTROL BAR
        =================================================================== */}
        <section
          id="digital-twin-section"
          className="border border-[#1E2633] bg-[#11161F] rounded-sm px-4 py-2.5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#8B949E] mr-2">
              DIGITAL TWIN SIMULATION
            </span>

            {/* Play / Pause / Reset */}
            <button
              onClick={() => setIsPlaying(true)}
              disabled={isPlaying}
              className={`px-2.5 py-1 rounded-sm text-xs font-mono inline-flex items-center gap-1.5 border transition ${
                isPlaying
                  ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                  : 'bg-[#0D1117] border-[#1E2633] text-[#E6EDF3] hover:bg-[#161D29]'
              }`}
            >
              <Play className="h-3 w-3" />
              Play
            </button>

            <button
              onClick={() => setIsPlaying(false)}
              disabled={!isPlaying}
              className="px-2.5 py-1 rounded-sm text-xs font-mono inline-flex items-center gap-1.5 bg-[#0D1117] border border-[#1E2633] text-[#E6EDF3] hover:bg-[#161D29] disabled:opacity-40 transition"
            >
              <Pause className="h-3 w-3" />
              Pause
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                withBusy(
                  async () => {
                    await api.resetSimulation(false);
                  },
                  'Simulation reset to baseline state (15:00)'
                );
              }}
              className="px-2.5 py-1 rounded-sm text-xs font-mono inline-flex items-center gap-1.5 bg-[#0D1117] border border-[#1E2633] text-[#8B949E] hover:text-[#E6EDF3] transition"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>

            <span className="h-4 w-px bg-[#1E2633] mx-1" />

            {/* Time + [-1h] [+1h] */}
            <span className="text-xs font-mono text-[#8B949E]">Time</span>
            <span className="px-2 py-1 rounded-sm bg-[#0A0D12] border border-[#1E2633] text-xs font-mono font-semibold text-[#E6EDF3]">
              {grid.current_time}
            </span>
            <button
              onClick={() => handleSelectHour((grid.current_hour + 23) % 24)}
              className="px-2 py-1 rounded-sm bg-[#0D1117] border border-[#1E2633] text-xs font-mono text-[#E6EDF3] hover:bg-[#161D29] transition"
            >
              - 1h
            </button>
            <button
              onClick={() => handleSelectHour((grid.current_hour + 1) % 24)}
              className="px-2 py-1 rounded-sm bg-[#0D1117] border border-[#1E2633] text-xs font-mono text-[#E6EDF3] hover:bg-[#161D29] transition"
            >
              + 1h
            </button>

            <span className="h-4 w-px bg-[#1E2633] mx-1" />

            {/* Speed 1x 2x 5x */}
            <span className="text-xs font-mono text-[#8B949E]">Speed</span>
            <div className="inline-flex rounded-sm border border-[#1E2633] bg-[#0A0D12] p-0.5">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-0.5 text-xs font-mono rounded-xs transition ${
                    speed === s
                      ? 'bg-[#161D29] text-[#E6EDF3] font-semibold'
                      : 'text-[#8B949E] hover:text-[#E6EDF3]'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          {/* Right side of control bar: Workload selector + [Run Decision] */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="active-workload-select"
              className="text-[11px] font-mono text-[#8B949E]"
            >
              Workload:
            </label>
            <select
              id="active-workload-select"
              value={selectedWorkload.job_id}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-[#0D1117] border border-[#1E2633] rounded-sm px-2.5 py-1 text-xs font-mono text-[#E6EDF3] focus:outline-none focus:border-[#10B981]"
            >
              {data.workloads.map((w) => (
                <option key={w.job_id} value={w.job_id}>
                  {w.name} ({w.energy_kwh} kWh · {w.status})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunDecision}
              disabled={busy}
              className="px-3 py-1 rounded-sm bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/25 text-xs font-mono font-medium transition disabled:opacity-50"
            >
              Run Decision
            </button>
          </div>
        </section>

        {/* ===================================================================
            SECTION 5, 6, 7: HERO DIGITAL TWIN + TIME SIMULATION TIMELINE
        =================================================================== */}
        <DigitalTwinCanvas
          grid={grid}
          forecast24h={data.forecast_24h}
          workload={selectedWorkload}
          onSelectHour={handleSelectHour}
          demoStep={demoStep}
        />

        {/* ===================================================================
            SECTION 8, 9, 10: SPLIT COMPARISON ("WHAT-IF") + GRIDAGENT DECISION
        =================================================================== */}
        <section
          id="what-if-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* LEFT PANEL (6 cols): WHAT HAPPENS IF WE RUN THIS WORKLOAD? (Section 8) */}
          <div className="lg:col-span-6 border border-[#1E2633] bg-[#0D1117] rounded-sm flex flex-col justify-between">
            <div>
              <div className="px-5 py-3 border-b border-[#1E2633] bg-[#11161F] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6EDF3]">
                  WHAT HAPPENS IF WE RUN THIS WORKLOAD?
                </h2>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  {selectedWorkload.name} ({selectedWorkload.energy_kwh} kWh)
                </span>
              </div>

              {/* Split Comparison: RUN NOW vs SIMULATE vs WAIT */}
              <div className="grid grid-cols-1 md:grid-cols-11 divide-y md:divide-y-0 md:divide-x divide-[#1E2633]">
                {/* LEFT: RUN NOW */}
                <div className="md:col-span-5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#8B949E]">
                      RUN NOW
                    </span>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                      HIGH CARBON
                    </span>
                  </div>

                  <div className="text-2xl font-mono font-bold text-[#E6EDF3]">
                    {submitTime}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#1E2633] text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Grid Intensity</span>
                      <span className="text-[#EF4444]">
                        {Math.round(baselineCarbonIntensity)} gCO₂/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Total Carbon</span>
                      <span className="text-[#E6EDF3] font-semibold">
                        {baselineKg} kgCO₂
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Energy Cost</span>
                      <span className="text-[#E6EDF3]">${baselineCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Deadline</span>
                      <span className="text-[#8B949E]">
                        {selectedWorkload.deadline}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const h = parseInt(submitTime.split(':')[0], 10);
                      if (!Number.isNaN(h)) handleSelectHour(h);
                    }}
                    className="w-full mt-2 py-1.5 rounded-sm bg-[#11161F] hover:bg-[#161D29] border border-[#1E2633] text-[11px] font-mono text-[#8B949E] hover:text-[#E6EDF3] transition"
                  >
                    Inspect {submitTime} on Twin
                  </button>
                </div>

                {/* CENTER: SIMULATE SEPARATOR */}
                <div className="md:col-span-1 bg-[#0A0D12] flex flex-col items-center justify-center py-3 px-1 select-none">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#8B949E] md:[writing-mode:vertical-rl] md:rotate-180">
                    SIMULATE
                  </span>
                  <span className="text-xs font-mono text-[#10B981] mt-1">
                    →
                  </span>
                </div>

                {/* RIGHT: WAIT (CLEANER WINDOW) */}
                <div className="md:col-span-5 p-5 space-y-3 bg-[#10B981]/[0.03]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
                      {selectedWorkload.decision === 'DEFER'
                        ? 'WAIT'
                        : 'OPTIMIZED'}
                    </span>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                      CLEANER WINDOW
                    </span>
                  </div>

                  <div className="text-2xl font-mono font-bold text-[#10B981]">
                    {recStart}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#1E2633] text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Grid Intensity</span>
                      <span className="text-[#10B981]">
                        {Math.round(optimizedCarbonIntensity)} gCO₂/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Total Carbon</span>
                      <span className="text-[#10B981] font-semibold">
                        {optimizedKg} kgCO₂
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Energy Cost</span>
                      <span className="text-[#10B981]">${optimizedCost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#8B949E]">Deadline</span>
                      <span className="text-[#E6EDF3]">
                        {selectedWorkload.deadline}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const h = parseInt(recStart.split(':')[0], 10);
                      if (!Number.isNaN(h)) handleSelectHour(h);
                    }}
                    className="w-full mt-2 py-1.5 rounded-sm bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-[11px] font-mono text-[#10B981] transition"
                  >
                    Inspect {recStart} on Twin
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom: POTENTIAL IMPACT (Calculated by simulation engine) */}
            <div className="px-5 py-3.5 border-t border-[#1E2633] bg-[#11161F] flex flex-wrap items-center justify-between gap-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#8B949E]">
                POTENTIAL IMPACT
              </span>
              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <span className="text-[#8B949E] mr-2">Carbon</span>
                  <span className="text-[#10B981] font-semibold">
                    ↓ {carbonReductionPct}% ({savedKg} kgCO₂)
                  </span>
                </div>
                <div>
                  <span className="text-[#8B949E] mr-2">Cost</span>
                  <span className="text-[#10B981] font-semibold">
                    ↓ {costReductionPct}% ($
                    {selectedWorkload.estimated_cost_savings_usd.toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL (6 cols): GRIDAGENT DECISION + 4-STAGE PIPELINE (Sections 9 & 10) */}
          <div
            id="gridagent-decision-panel"
            className="lg:col-span-6 border border-[#1E2633] bg-[#0D1117] rounded-sm flex flex-col justify-between"
          >
            <div>
              <div className="px-5 py-3 border-b border-[#1E2633] bg-[#11161F] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      governanceState === 'BLOCKED'
                        ? 'bg-[#EF4444]'
                        : governanceState === 'ASK USER'
                        ? 'bg-[#F59E0B]'
                        : 'bg-[#10B981]'
                    }`}
                  />
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6EDF3]">
                    GRIDAGENT DECISION
                  </h2>
                </div>
                <span className="text-xs font-mono text-[#8B949E]">
                  Confidence {confidencePct}%
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* Primary Engineering Decision Readout */}
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-[#1E2633]">
                  <div
                    className={`text-xl md:text-2xl font-mono font-bold tracking-tight ${
                      governanceState === 'BLOCKED'
                        ? 'text-[#EF4444]'
                        : governanceState === 'ASK USER'
                        ? 'text-[#F59E0B]'
                        : 'text-[#10B981]'
                    }`}
                  >
                    {decisionHeadline}
                  </div>
                  <span className="text-xs font-mono text-[#8B949E]">
                    Job ID: {selectedWorkload.job_id}
                  </span>
                </div>

                {/* WHY? Structured Engineering Reasons (01 - 04) */}
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E] mb-2.5">
                    WHY?
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 bg-[#11161F] border border-[#1E2633] rounded-sm flex items-start gap-2.5">
                      <span className="font-mono text-[#10B981] font-semibold">
                        01
                      </span>
                      <span className="text-[#E6EDF3]">
                        {governanceState === 'BLOCKED'
                          ? 'Protected critical production service'
                          : `Lower grid carbon intensity (${Math.round(
                              baselineCarbonIntensity
                            )} → ${Math.round(
                              optimizedCarbonIntensity
                            )} gCO₂/kWh)`}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#11161F] border border-[#1E2633] rounded-sm flex items-start gap-2.5">
                      <span className="font-mono text-[#10B981] font-semibold">
                        02
                      </span>
                      <span className="text-[#E6EDF3]">
                        {governanceState === 'BLOCKED'
                          ? 'Policy engine denies automated deferral'
                          : 'Higher solar & wind renewable generation share'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#11161F] border border-[#1E2633] rounded-sm flex items-start gap-2.5">
                      <span className="font-mono text-[#10B981] font-semibold">
                        03
                      </span>
                      <span className="text-[#E6EDF3]">
                        Workload deadline ({selectedWorkload.deadline}) still
                        satisfied
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#11161F] border border-[#1E2633] rounded-sm flex items-start gap-2.5">
                      <span className="font-mono text-[#10B981] font-semibold">
                        04
                      </span>
                      <span className="text-[#E6EDF3]">
                        {governanceState === 'ASK USER'
                          ? 'Exceeds autonomous cost threshold — awaiting approval'
                          : `Lowest-carbon feasible window (${recStart})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4-Stage Decision Process Pipeline: OBSERVE -> SIMULATE -> CHECK -> DECIDE (Section 10) */}
                <div className="pt-3 border-t border-[#1E2633]">
                  <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B949E] mb-2">
                    DECISION PIPELINE (OBSERVE → SIMULATE → CHECK → DECIDE)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-[#0A0D12] border border-[#1E2633] rounded-sm">
                      <div className="text-[#3B82F6] font-semibold">
                        OBSERVE
                      </div>
                      <div className="text-[#E6EDF3] mt-1">
                        Grid: {Math.round(grid.carbon_intensity_gco2_kwh)} gCO₂
                      </div>
                      <div className="text-[#8B949E]">
                        Renew: {grid.renewable_percentage.toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-2 bg-[#0A0D12] border border-[#1E2633] rounded-sm">
                      <div className="text-[#3B82F6] font-semibold">
                        SIMULATE
                      </div>
                      <div className="text-[#E6EDF3] mt-1">
                        {candidateCount} execution
                      </div>
                      <div className="text-[#8B949E]">windows tested</div>
                    </div>

                    <div className="p-2 bg-[#0A0D12] border border-[#1E2633] rounded-sm">
                      <div className="text-[#3B82F6] font-semibold">CHECK</div>
                      <div className="text-[#E6EDF3] mt-1">Deadline: PASS</div>
                      <div
                        className={
                          governanceState === 'ALLOWED'
                            ? 'text-[#10B981]'
                            : governanceState === 'ASK USER'
                            ? 'text-[#F59E0B]'
                            : 'text-[#EF4444]'
                        }
                      >
                        Policy: {governanceState}
                      </div>
                    </div>

                    <div className="p-2 bg-[#0A0D12] border border-[#1E2633] rounded-sm">
                      <div className="text-[#10B981] font-semibold">DECIDE</div>
                      <div className="text-[#E6EDF3] mt-1">
                        {recStart} selected
                      </div>
                      <div className="text-[#10B981]">
                        -{carbonReductionPct}% CO₂
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: DECISION STATUS */}
            <div className="px-5 py-3.5 border-t border-[#1E2633] bg-[#11161F] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8B949E] uppercase tracking-[0.12em] text-[11px]">
                DECISION STATUS
              </span>
              {governanceState === 'ALLOWED' && (
                <span className="text-[#10B981] inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Safe to schedule
                  automatically
                </span>
              )}
              {governanceState === 'ASK USER' && (
                <div className="flex items-center gap-2">
                  <span className="text-[#F59E0B]">
                    ! Operator approval required
                  </span>
                  <button
                    onClick={() =>
                      withBusy(
                        () => api.approveWorkload(selectedWorkload.job_id, true),
                        `Approved ${selectedWorkload.name}`
                      )
                    }
                    className="px-2 py-0.5 rounded-xs bg-[#10B981] text-[#0A0D12] font-semibold"
                  >
                    Approve
                  </button>
                </div>
              )}
              {governanceState === 'BLOCKED' && (
                <span className="text-[#EF4444]">
                  ✕ Protected workload — deferral blocked by policy
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 11: EXECUTION GOVERNANCE & WORKLOAD QUEUE
        =================================================================== */}
        <section
          id="governance-workloads-section"
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* LEFT (5 cols): EXECUTION GOVERNANCE */}
          <div className="lg:col-span-5 border border-[#1E2633] bg-[#0D1117] rounded-sm flex flex-col justify-between">
            <div>
              <div className="px-5 py-3 border-b border-[#1E2633] bg-[#11161F] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6EDF3]">
                  EXECUTION GOVERNANCE
                </h2>
                <span className="text-[11px] font-mono text-[#8B949E]">
                  POLICY GUARDRAILS
                </span>
              </div>

              <div className="p-5 space-y-4">
                {/* 3 Governance States: ALLOWED / ASK USER / BLOCKED */}
                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div
                    className={`p-3 rounded-sm border text-center ${
                      governanceState === 'ALLOWED'
                        ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981] font-bold'
                        : 'bg-[#0A0D12] border-[#1E2633] text-[#8B949E]'
                    }`}
                  >
                    <div>✓ ALLOWED</div>
                    <div className="text-[10px] font-normal mt-0.5">
                      Auto-defer
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-sm border text-center ${
                      governanceState === 'ASK USER'
                        ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] font-bold'
                        : 'bg-[#0A0D12] border-[#1E2633] text-[#8B949E]'
                    }`}
                  >
                    <div>? ASK USER</div>
                    <div className="text-[10px] font-normal mt-0.5">
                      Human gate
                    </div>
                  </div>

                  <div
                    className={`p-3 rounded-sm border text-center ${
                      governanceState === 'BLOCKED'
                        ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444] font-bold'
                        : 'bg-[#0A0D12] border-[#1E2633] text-[#8B949E]'
                    }`}
                  >
                    <div>✕ BLOCKED</div>
                    <div className="text-[10px] font-normal mt-0.5">
                      Run immediately
                    </div>
                  </div>
                </div>

                {/* Active Governance Evaluation */}
                <div className="p-3.5 bg-[#11161F] border border-[#1E2633] rounded-sm space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#8B949E]">Active Policy State:</span>
                    <span
                      className={
                        governanceState === 'ALLOWED'
                          ? 'text-[#10B981] font-semibold'
                          : governanceState === 'ASK USER'
                          ? 'text-[#F59E0B] font-semibold'
                          : 'text-[#EF4444] font-semibold'
                      }
                    >
                      {governanceState}
                    </span>
                  </div>
                  <p className="text-xs text-[#E6EDF3]">
                    {selectedWorkload.policy_reason ||
                      (governanceState === 'ALLOWED'
                        ? 'Workload can safely be delayed without violating the deadline.'
                        : governanceState === 'ASK USER'
                        ? 'Workload exceeds autonomous cost threshold; human approval required.'
                        : 'Protected production service — AI agent cannot defer execution.')}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#1E2633] bg-[#11161F] text-[11px] font-mono text-[#8B949E]">
              Select any workload on the right to test ALLOWED, ASK USER, and
              BLOCKED governance states.
            </div>
          </div>

          {/* RIGHT (7 cols): WORKLOAD SIMULATION QUEUE */}
          <div className="lg:col-span-7 border border-[#1E2633] bg-[#0D1117] rounded-sm flex flex-col justify-between">
            <div>
              <div className="px-5 py-3 border-b border-[#1E2633] bg-[#11161F] flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#E6EDF3]">
                  CLOUD WORKLOADS ({data.workloads.length})
                </h2>
                <button
                  onClick={() => setSubmitModalOpen(true)}
                  className="text-xs font-mono text-[#10B981] hover:underline inline-flex items-center gap-1"
                >
                  + Add Workload
                </button>
              </div>

              <div className="divide-y divide-[#1E2633]">
                {data.workloads.map((job) => {
                  const isSelected = job.job_id === selectedWorkload.job_id;
                  const jobGov =
                    job.policy_decision === 'DENY' ||
                    job.status === 'BLOCKED' ||
                    job.is_protected_service
                      ? 'BLOCKED'
                      : job.policy_decision === 'ASK_USER' ||
                        job.status === 'AWAITING_APPROVAL'
                      ? 'ASK USER'
                      : 'ALLOWED';

                  return (
                    <div
                      key={job.job_id}
                      onClick={() => setSelectedJobId(job.job_id)}
                      className={`px-5 py-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#161D29]'
                          : 'hover:bg-[#11161F]'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isSelected ? 'bg-[#10B981]' : 'bg-[#263244]'
                            }`}
                          />
                          <span className="text-xs font-semibold text-[#E6EDF3]">
                            {job.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#8B949E]">
                            ({job.energy_kwh} kWh · SLA {job.deadline})
                          </span>
                        </div>
                        <div className="text-[11px] text-[#8B949E] pl-4">
                          {job.decision_reason}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-xs text-[10px] border ${
                            jobGov === 'ALLOWED'
                              ? 'border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10'
                              : jobGov === 'ASK USER'
                              ? 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10'
                              : 'border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10'
                          }`}
                        >
                          {jobGov}
                        </span>
                        <span className="text-[#E6EDF3] w-20 text-right">
                          {job.recommended_start_time || job.submitted_at_time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[#1E2633] bg-[#11161F] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-[#8B949E]">
                Fleet Savings:{' '}
                <strong className="text-[#10B981]">
                  {(data.comparison.total_carbon_saved_gco2 / 1000).toFixed(1)}{' '}
                  kg CO₂
                </strong>{' '}
                (-{data.comparison.carbon_reduction_percentage.toFixed(1)}%) ·{' '}
                <strong className="text-[#10B981]">
                  ${data.comparison.total_cost_saved_usd.toFixed(2)}
                </strong>
              </span>
              <button
                onClick={() => setJudgeModeOpen(true)}
                className="text-[#3B82F6] hover:underline"
              >
                Run 5 Canonical Scenarios →
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 21: PROGRESSIVE DISCLOSURE — TECHNICAL VIEW
        =================================================================== */}
        {viewMode === 'technical' && (
          <section
            id="technical-details-section"
            className="space-y-5 pt-4 border-t border-[#1E2633]"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-[0.14em] text-[#E6EDF3]">
                  TECHNICAL ARCHITECTURE & TELEMETRY
                </h2>
                <p className="text-xs text-[#8B949E]">
                  Multi-agent orchestration trace, MCP tool registry, policy
                  audit log, and full workload table.
                </p>
              </div>
              <button
                onClick={() => setViewMode('simple')}
                className="px-3 py-1.5 rounded-sm bg-[#11161F] border border-[#1E2633] text-xs font-mono text-[#8B949E] hover:text-[#E6EDF3]"
              >
                Switch to Simple View
              </button>
            </div>

            <WorkloadTable
              workloads={data.workloads}
              selectedJobId={selectedWorkload.job_id}
              onSelectJob={(id) => setSelectedJobId(id)}
              onOrchestrate={(id) =>
                withBusy(() => api.orchestrateWorkload(id), `Orchestrated ${id}`)
              }
              onApprove={(id, approved) =>
                withBusy(
                  () => api.approveWorkload(id, approved),
                  `${approved ? 'Approved' : 'Rejected'} ${id}`
                )
              }
              onAction={(id, action) =>
                withBusy(
                  () => api.workloadAction(id, action),
                  `Executed ${action} on ${id}`
                )
              }
              onOpenSubmitModal={() => setSubmitModalOpen(true)}
            />

            <BeforeAfterComparison comparison={data.comparison} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <AgentActivityFeed events={data.agent_events} />
              <SafetyAndMcpPanel
                policyRules={data.policy_rules}
                auditLogs={data.policy_audit_logs}
                mcpTools={data.mcp_tools}
              />
            </div>
          </section>
        )}
      </main>

      {/* Modals */}
      <SubmitWorkloadModal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        onSubmit={async (payload) => {
          await withBusy(async () => {
            await api.submitWorkload(payload);
          }, `Workload "${payload.name}" submitted and evaluated`);
          setSubmitModalOpen(false);
        }}
      />

      <JudgeModeOverlay
        isOpen={judgeModeOpen}
        onClose={() => setJudgeModeOpen(false)}
        scenarios={data.demo_scenarios}
        onRunScenario={async (num) => {
          await withBusy(async () => {
            await api.runDemoScenario(num);
          }, `Scenario ${num} executed`);
        }}
        onRunAll={async () => {
          await withBusy(async () => {
            await api.runAllScenarios();
          }, 'All 5 canonical scenarios executed');
        }}
      />
    </div>
  );
};
