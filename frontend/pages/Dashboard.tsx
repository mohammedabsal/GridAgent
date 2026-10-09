import React, { useCallback, useEffect, useState } from 'react';
import { Check, Pause, Play, Plus } from 'lucide-react';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { BeforeAfterComparison } from '../components/BeforeAfterComparison';
import { DigitalTwinCanvas } from '../components/DigitalTwinCanvas';
import { EnergyIntelligence } from '../components/EnergyIntelligence';
<<<<<<< HEAD
import { PageHeroArt, ScreenIllustration } from '../components/ScreenIllustrations';
import { ImpactHero } from '../components/ImpactHero';
import { IndiaContextStrip } from '../components/IndiaContextStrip';
import { JuryEmptyState } from '../components/JuryEmptyState';
import { JuryToast } from '../components/JuryToast';
=======
import {
  PageHeroArt,
  ScreenIllustration,
} from '../components/ScreenIllustrations';
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
import { SafetyAndMcpPanel } from '../components/SafetyAndMcpPanel';
import { SafetyExtraPanels } from '../components/SafetyExtraPanels';
import { SubmitWorkloadModal } from '../components/SubmitWorkloadModal';
import { WorkloadTable } from '../components/WorkloadTable';
import { api, DashboardState } from '../services/api';
import { RecommendedDashboardLayout } from '../components/RecommendedDashboardLayout';
import {
  AnimatedNumber,
  JUDGE_MODE_SCENES,
} from '../components/motion';

export type NavSection =
  | 'dashboard'
  | 'simulation'
  | 'workloads'
  | 'energy'
  | 'impact'
  | 'safety';

export const APP_SUB_ROUTES: { id: NavSection; label: string; path: string }[] =
  [
    { id: 'dashboard', label: 'Dashboard', path: '/app/dashboard' },
    { id: 'simulation', label: 'Simulation', path: '/app/simulation' },
    { id: 'workloads', label: 'Workloads', path: '/app/workloads' },
    { id: 'energy', label: 'Energy', path: '/app/energy' },
    { id: 'impact', label: 'Impact', path: '/app/impact' },
    { id: 'safety', label: 'Safety', path: '/app/safety' },
  ];

export function resolveSubRoute(pathname: string): NavSection {
  const normalized = pathname.replace(/\/+$/, '') || '/app';
  const found = APP_SUB_ROUTES.find((r) => r.path === normalized);
  if (found) return found.id;
  return 'dashboard';
}

export function navigateToSubRoute(path: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export const Dashboard: React.FC<{ initialSection?: NavSection }> = ({
  initialSection = 'dashboard',
}) => {
  const [data, setData] = useState<DashboardState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState<NavSection>(initialSection);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [selectedJobId, setSelectedJobId] = useState<string>('AI-TRAINING-001');
  const [viewMode, setViewMode] = useState<'simple' | 'technical'>('simple');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [bannerNote, setBannerNote] = useState<string | null>(null);

  // Stage-by-stage AI decision reveal state
  const [analysisStage, setAnalysisStage] = useState<string | null>(null);

  // 10-Scene Judge Mode state & camera focus
  const [judgeScene, setJudgeScene] = useState<number | null>(null);
  const [judgeFinalBanner, setJudgeFinalBanner] = useState<boolean>(false);

  useEffect(() => {
    setActiveNav(initialSection);
  }, [initialSection]);

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

  const navigateTo = (id: NavSection) => {
    const route = APP_SUB_ROUTES.find((r) => r.id === id);
    if (!route) return;
    setActiveNav(id);
    navigateToSubRoute(route.path);
  };

  // Physical Time Slider — instant optimistic update + backend sync
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
      await api.updateSimulation({ current_hour: clamped });
      await fetchDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Real stage-by-stage AI decision analysis animation
  const handleRunDecision = async () => {
    if (busy || analysisStage) return;
    setBusy(true);
    try {
      setAnalysisStage('ANALYZING · Observing grid carbon & solar forecast...');
      await new Promise((r) => setTimeout(r, 320));
      setAnalysisStage('SIMULATING · Comparing candidate execution windows...');
      await api.orchestrateWorkload(selectedJobId);
      await new Promise((r) => setTimeout(r, 340));
      setAnalysisStage('CHECKING · Validating SLA deadline & safety policy...');
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 320));
      setAnalysisStage('BEST WINDOW FOUND · Decision locked');
      await new Promise((r) => setTimeout(r, 420));
      setBannerNote(`Executed carbon-aware decision on ${selectedJobId}.`);
      setTimeout(() => setBannerNote(null), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalysisStage(null);
      setBusy(false);
    }
  };

  // Guided 10-Scene Cinematic Judge Mode Experience
  const handleRunLiveDemo = async () => {
    if (busy || judgeScene !== null) return;
    setIsPlaying(false);
    setJudgeFinalBanner(false);
    setSelectedJobId('AI-TRAINING-001');
    setBusy(true);

    try {
      // Scene 1: Workload enters Digital Twin at 15:00
      setJudgeScene(1);
      await api.updateSimulation({
        current_hour: 15,
        override_current_carbon: null,
        override_current_solar_mw: null,
      });
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1200));

      // Scene 2: Grid is carbon-intensive right now (700 gCO2/kWh)
      setJudgeScene(2);
      await new Promise((r) => setTimeout(r, 1200));

      // Scene 3: Let's see what happens if we wait (timeline activates)
      setJudgeScene(3);
      for (const h of [15, 16, 17]) {
        await handleSelectHour(h);
        await new Promise((r) => setTimeout(r, 420));
      }

      // Scene 4: Cleaner window appears at 17:00
      setJudgeScene(4);
      await new Promise((r) => setTimeout(r, 1100));

      // Scene 5: AI Recommendation: WAIT UNTIL 17:00
      setJudgeScene(5);
      await api.orchestrateWorkload('AI-TRAINING-001');
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1200));

      // Scene 6: Safety Check: SAFE TO WAIT
      setJudgeScene(6);
      await new Promise((r) => setTimeout(r, 1100));

      // Scene 7: Workload moves from 15:00 -> 17:00
      setJudgeScene(7);
      await new Promise((r) => setTimeout(r, 1100));

      // Scene 8: Digital Twin transitions to cleaner state at 17:00
      setJudgeScene(8);
      await api.runJudgeWalkthrough();
      await api.updateSimulation({ current_hour: 17 });
      await fetchDashboard();
      await new Promise((r) => setTimeout(r, 1300));

      // Scene 9: Result: 44.3% LESS CARBON
      setJudgeScene(9);
      await new Promise((r) => setTimeout(r, 1300));

      // Scene 10: Final Statement: SAME WORKLOAD. SAME OUTPUT. CLEANER ELECTRICITY.
      setJudgeScene(10);
      setJudgeFinalBanner(true);
      await new Promise((r) => setTimeout(r, 2200));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setJudgeScene(null);
      setBusy(false);
    }
  };

  const withBusy = async (fn: () => Promise<unknown>, note?: string) => {
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

  // Keyboard shortcuts for jury demos: ←/→ scrub timeline, Space plays/pauses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const cur = data?.grid_status.current_hour ?? 15;
        const delta = e.key === 'ArrowRight' ? 1 : 23;
        handleSelectHour((cur + delta) % 24);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.grid_status.current_hour]);

  const handleChangeProfile = (profile: string) => {
    withBusy(
      async () => {
        await api.updateSimulation({ profile });
      },
      `Switched grid to '${profile}' profile.`,
    );
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center ga-app-bg text-[#0d3f3a] p-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-emerald-200/70 bg-white/95 backdrop-blur-md p-8 text-center shadow-xl shadow-emerald-900/5 ga-stage-1">
          <ScreenIllustration kind="simulation" className="h-28 w-28" />
          <div className="flex items-center gap-3 font-mono text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
            INITIALIZING GRIDAGENT-AI DIGITAL TWIN...
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center ga-app-bg p-6">
        <div className="bg-white/95 backdrop-blur-md border border-[#EF4444]/50 rounded-2xl p-6 max-w-md space-y-4 text-center shadow-xl">
          <div className="flex justify-center">
            <ScreenIllustration kind="error" className="h-24 w-24" />
          </div>
          <div className="text-xs font-mono uppercase tracking-wider text-[#EF4444]">
            SIMULATION ENGINE DISCONNECTED
          </div>
          <p className="text-xs text-slate-500 font-mono">{error}</p>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 rounded-2xl bg-[#10B981] text-white font-mono font-semibold text-xs shadow-sm"
          >
            RETRY CONNECTION
          </button>
        </div>
      </div>
    );
  }

  const grid = data.grid_status;
  const selectedWorkload =
    data.workloads.find((w) => w.job_id === selectedJobId) ||
    data.workloads[0];
  const recStart =
    selectedWorkload?.recommended_start_time ||
    selectedWorkload?.submitted_at_time ||
    '17:00';
  const submitTime = selectedWorkload?.submitted_at_time || '15:00';
  const baselineCarbonIntensity =
    selectedWorkload?.current_carbon_intensity ??
    grid.carbon_intensity_gco2_kwh;
  const optimizedCarbonIntensity =
    selectedWorkload?.predicted_carbon_intensity ??
    grid.carbon_intensity_gco2_kwh;
  const baselineKgNum = (selectedWorkload?.baseline_emissions_gco2 ?? 0) / 1000;
  const optimizedKgNum =
    (selectedWorkload?.optimized_emissions_gco2 ?? 0) / 1000;
  const savedKgNum = Math.max(0, baselineKgNum - optimizedKgNum);
  const baselineCostNum = selectedWorkload?.baseline_cost_usd ?? 0;
  const optimizedCostNum = selectedWorkload?.optimized_cost_usd ?? 0;
  const carbonReductionPctNum = selectedWorkload?.carbon_reduction_pct ?? 0;

  const governanceState =
    selectedWorkload?.policy_decision === 'DENY' ||
    selectedWorkload?.status === 'BLOCKED' ||
    selectedWorkload?.is_protected_service
      ? 'BLOCKED'
      : selectedWorkload?.policy_decision === 'ASK_USER' ||
        selectedWorkload?.status === 'AWAITING_APPROVAL'
      ? 'ASK USER'
      : 'ALLOWED';

  const decisionHeadline =
    governanceState === 'BLOCKED'
      ? 'RUN IMMEDIATELY (PROTECTED)'
      : governanceState === 'ASK USER'
      ? `HOLD FOR APPROVAL (${recStart})`
      : selectedWorkload?.decision === 'DEFER'
      ? `WAIT UNTIL ${recStart}`
      : `RUN AT ${recStart}`;

  const currentSceneObj =
    judgeScene !== null
      ? JUDGE_MODE_SCENES.find((s) => s.scene === judgeScene) || null
      : null;

  const focusClass = (
    target: 'twin' | 'timeline' | 'decision' | 'safety' | 'impact'
  ) => {
    if (!currentSceneObj) return 'ga-focus-region';
    return currentSceneObj.focusTarget === target ||
      (target === 'twin' && currentSceneObj.focusTarget === 'timeline')
      ? 'ga-focus-region ga-focus-active'
      : 'ga-focus-region ga-focus-dimmed';
  };

  return (
    <div className="min-h-screen ga-app-bg text-[#0d3f3a] flex flex-col font-sans selection:bg-[#10B981]/25">
      {/* TOP BAR */}
      <header className="h-12 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 ga-stage-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 hover:text-[#0d3f3a] hover:bg-emerald-100 transition"
          >
            <span className="flex flex-col items-center justify-center gap-[3px]">
              <span className="block h-[2px] w-4 rounded bg-current" />
              <span className="block h-[2px] w-4 rounded bg-current" />
              <span className="block h-[2px] w-4 rounded bg-current" />
            </span>
          </button>
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2.5"
          >
            <span className="h-2.5 w-2.5 rounded-lg bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-sm font-bold tracking-tight text-[#0d3f3a]">
              GridAgent-AI
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunLiveDemo}
            disabled={busy || judgeScene !== null}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#047857] hover:bg-[#10B981]/25 text-xs font-mono font-semibold transition shadow-sm disabled:opacity-50"
          >
            {judgeScene !== null
              ? `● SCENE ${judgeScene}/10`
              : '▶ RUN LIVE DEMO'}
          </button>
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-0.5 text-xs">
            <button
              onClick={() => setViewMode('simple')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'simple'
                  ? 'bg-emerald-100 text-[#0d3f3a] font-medium shadow-sm'
                  : 'text-slate-500 hover:text-[#0d3f3a]'
              }`}
            >
              Simple View
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewMode === 'technical'
                  ? 'bg-emerald-100 text-[#0d3f3a] font-medium shadow-sm'
                  : 'text-slate-500 hover:text-[#0d3f3a]'
              }`}
            >
              Technical View
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 w-full min-h-0">
        <aside
          className={`shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-md transition-all duration-200 min-h-[calc(100vh-3rem)] sticky top-12 self-start ${
            sidebarOpen ? 'w-52' : 'w-14'
          }`}
        >
          <div className="p-2">
            {sidebarOpen && (
              <div className="px-2 pb-2 pt-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
                Features
              </div>
            )}
            <nav className="flex flex-col gap-1 text-xs">
              {APP_SUB_ROUTES.map((route) => {
                const active = activeNav === route.id;
                return (
                  <button
                    key={route.id}
                    onClick={() => navigateTo(route.id)}
                    title={route.label}
                    className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-2 transition ${
                      sidebarOpen ? 'justify-start' : 'justify-center'
                    } ${
                      active
                        ? 'text-[#0d3f3a] bg-emerald-100/90 font-medium border border-emerald-200/80 shadow-sm'
                        : 'text-slate-500 hover:text-[#0d3f3a] hover:bg-slate-50 border border-transparent'
                    }`}
                  >
<<<<<<< HEAD
                    <span className={`h-2 w-2 rounded-full shrink-0 ${active ? 'bg-[#10B981]' : 'bg-slate-300'}`} />
=======
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        active
                          ? 'bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                          : 'bg-[#263244]'
                      }`}
                    />
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
                    {sidebarOpen && <span>{route.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-1 w-full min-w-0 max-w-[1440px] mx-auto px-4 md:px-6 py-5 space-y-5">
<<<<<<< HEAD
          <IndiaContextStrip data={data} busy={busy} onChangeProfile={handleChangeProfile} />
          {toastMessage && (
            <div className="bg-slate-50 border border-[#10B981]/50 text-[#0d3f3a] px-4 py-2.5 rounded-2xl text-xs font-mono flex items-center justify-between">
              <span>{toastMessage}</span>
              <button onClick={() => setToastMessage(null)} className="text-slate-500 hover:text-[#0d3f3a]">✕</button>
            </div>
          )}
          <JuryToast message={toastMessage} note={bannerNote} onDismiss={() => { setToastMessage(null); setBannerNote(null); }} />
          {activeNav === 'dashboard' && (
          <div className="space-y-5">
            <section id="console-header" className="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-xl shadow-emerald-900/5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-slate-200">
=======
          {/* Status / Toast / AI Scanning Feedback */}
          {(toastMessage || bannerNote || analysisStage) && (
            <div
              className={`bg-white/95 backdrop-blur-md border border-[#10B981]/50 text-[#0d3f3a] px-4 py-2.5 rounded-2xl text-xs font-mono flex items-center justify-between shadow-md ${
                analysisStage ? 'ga-scan-bar' : ''
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
                {analysisStage || toastMessage || bannerNote}
              </span>
              <button
                onClick={() => {
                  setToastMessage(null);
                  setBannerNote(null);
                }}
                className="text-slate-500 hover:text-[#0d3f3a]"
              >
                ✕
              </button>
            </div>
          )}

          {/* Judge Mode Final Statement Banner (Scene 10) */}
          {judgeFinalBanner && (
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-950 via-[#0d3f3a] to-emerald-900 text-white p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ga-stage-2">
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
              <div className="space-y-1">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-300">
                  JUDGE WALKTHROUGH COMPLETE ·{' '}
                  {carbonReductionPctNum.toFixed(1)}% LESS CARBON
                </div>
                <div className="text-lg md:text-2xl font-extrabold tracking-tight">
                  SAME WORKLOAD. SAME OUTPUT. CLEANER ELECTRICITY.
                </div>
                <div className="text-xs text-emerald-100/90 font-mono">
                  {selectedWorkload?.name}: {baselineKgNum.toFixed(1)} kg CO₂ →{' '}
                  {optimizedKgNum.toFixed(1)} kg CO₂ ({savedKgNum.toFixed(1)} kg
                  saved) · SLA {selectedWorkload?.deadline} satisfied
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setJudgeFinalBanner(false);
                    navigateTo('simulation');
                  }}
                  className="px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition"
                >
                  Explore the Digital Twin
                </button>
                <button
                  onClick={() => setJudgeFinalBanner(false)}
                  className="px-3 py-2 rounded-full border border-emerald-400/40 text-emerald-200 hover:text-white text-xs font-mono"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {activeNav === 'dashboard' && (
<<<<<<< HEAD
            <PageHeroArt kind="dashboard" eyebrow="Dashboard · Operations console" title="Carbon-aware operations at a glance" description="Live grid carbon, renewable share, active workload and the recommended clean window." />
          )}
          {activeNav === 'simulation' && (
            <PageHeroArt kind="simulation" eyebrow="Simulation · Digital twin" title="Step the 24-hour grid and test decisions" description="Play, pause and scrub the twin to see how carbon intensity and renewables shift through the day." />
          )}
          {activeNav === 'simulation' && (
          <section id="digital-twin-section" className="border border-slate-200 bg-slate-50 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 mr-2">DIGITAL TWIN SIMULATION</span>
              <button onClick={() => setIsPlaying(true)} disabled={isPlaying} className={`px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 border transition ${isPlaying ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' : 'bg-white border-slate-200 text-[#0d3f3a] hover:bg-emerald-100'}`}>▶ Play</button>
              <button onClick={() => setIsPlaying(false)} disabled={!isPlaying} className="px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 bg-white border border-slate-200 text-[#0d3f3a] hover:bg-emerald-100 disabled:opacity-40 transition">⏸ Pause</button>
              <button onClick={() => { setIsPlaying(false); withBusy(async () => { await api.resetSimulation(false); }, 'Simulation reset to baseline state (15:00)'); }} className="px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-500 hover:text-[#0d3f3a] transition">↺ Reset</button>
              <span className="hidden md:inline text-[10px] font-mono text-slate-400 border border-dashed border-slate-200 rounded-lg px-1.5 py-0.5" title="Keyboard shortcuts">←/→ hour · Space play</span>
              <span className="h-4 w-px bg-slate-200 mx-1" />
              <span className="text-xs font-mono text-slate-500">Time</span>
              <span className="px-2 py-1 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-[#0d3f3a]">{grid.current_time}</span>
              <button onClick={() => handleSelectHour((grid.current_hour + 23) % 24)} className="px-2 py-1 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-[#0d3f3a] hover:bg-emerald-100 transition">- 1h</button>
              <button onClick={() => handleSelectHour((grid.current_hour + 1) % 24)} className="px-2 py-1 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-[#0d3f3a] hover:bg-emerald-100 transition">+ 1h</button>
              <span className="h-4 w-px bg-slate-200 mx-1" />
              <span className="text-xs font-mono text-slate-500">Speed</span>
              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-0.5">
                {([1, 2, 5] as const).map((s) => (
                  <button key={s} onClick={() => setSpeed(s)} className={`px-2 py-0.5 text-xs font-mono rounded-lg transition ${speed === s ? 'bg-emerald-100 text-[#0d3f3a] font-semibold' : 'text-slate-500 hover:text-[#0d3f3a]'}`}>{s}×</button>
                ))}
=======
            <div className="space-y-5">
              {/* Operations Console Header + 4 Animated KPIs */}
              <section
                id="console-header"
                className="border border-slate-200/80 bg-white rounded-2xl p-5 shadow-xl shadow-emerald-900/5 ga-glass-card ga-stage-2"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-5 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                        GRIDAGENT-AI
                      </span>
                      <span className="text-slate-300">/</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        OPERATIONS CONTROL SYSTEM
                      </span>
                    </div>
                    <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#0d3f3a]">
                      Carbon-Aware Cloud Workload Simulation
                    </h1>
                    <p className="text-xs md:text-sm text-slate-500 max-w-2xl">
                      Simulate workload execution against grid carbon intensity,
                      renewable generation, cost, and operational constraints.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={handleRunLiveDemo}
                      disabled={busy || judgeScene !== null}
                      className="px-7 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/25 disabled:opacity-50"
                    >
                      {judgeScene !== null
                        ? `▶ SCENE ${judgeScene}/10...`
                        : '▶ RUN SIMULATION'}
                    </button>
                    <button
                      onClick={() => navigateTo('impact')}
                      className="px-7 py-2.5 rounded-full bg-white hover:border-emerald-400 hover:text-emerald-700 text-slate-700 border border-slate-300 text-xs font-bold transition shadow-sm"
                    >
                      VIEW DECISION
                    </button>
                  </div>
                </div>

                {/* 4 Animated KPI Readouts */}
                <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 pt-4">
                  <div className="pr-4 py-1">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      GRID CARBON
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-mono font-semibold text-[#0d3f3a]">
                        <AnimatedNumber
                          value={grid.carbon_intensity_gco2_kwh}
                          decimals={0}
                          suffix=" gCO₂/kWh"
                        />
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
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      RENEWABLE
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-mono font-semibold text-[#0d3f3a]">
                        <AnimatedNumber
                          value={grid.renewable_percentage}
                          decimals={1}
                          suffix="%"
                        />
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        <AnimatedNumber
                          value={
                            grid.solar_generation_mw + grid.wind_generation_mw
                          }
                          decimals={0}
                          suffix=" MW"
                        />
                      </span>
                    </div>
                  </div>

                  <div className="lg:px-5 py-1">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      WORKLOAD
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-mono font-semibold text-[#0d3f3a]">
                        {selectedWorkload?.energy_kwh ?? 0} kWh
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 truncate">
                        {selectedWorkload?.name}
                      </span>
                    </div>
                  </div>

                  <div className="lg:pl-5 py-1">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      RECOMMENDED
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-mono font-semibold text-[#10B981]">
                        {recStart}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        <AnimatedNumber
                          value={optimizedCarbonIntensity}
                          decimals={0}
                          suffix=" gCO₂/kWh"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* HERO DIGITAL TWIN ON DASHBOARD */}
              {selectedWorkload && (
                <div className={`ga-stage-3 ${focusClass('twin')}`}>
                  <DigitalTwinCanvas
                    grid={grid}
                    forecast24h={data.forecast_24h}
                    workload={selectedWorkload}
                    onSelectHour={handleSelectHour}
                    demoStep={judgeScene}
                  />
                </div>
              )}

              <div className={`ga-stage-4 ${focusClass('decision')}`}>
                <RecommendedDashboardLayout data={data} />
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
              </div>
            </div>
          )}

          {activeNav === 'dashboard' && (
            <PageHeroArt
              kind="dashboard"
              eyebrow="Dashboard · Operations console"
              title="Carbon-aware operations at a glance"
              description="Live grid carbon, renewable share, active workload and the recommended clean window."
            />
          )}

          {activeNav === 'simulation' && (
            <PageHeroArt
              kind="simulation"
              eyebrow="Simulation · Digital twin"
              title="Step the 24-hour grid and test decisions"
              description="Play, pause and scrub the twin to see how carbon intensity and renewables shift through the day."
            />
          )}

          {activeNav === 'simulation' && (
            <section
              id="digital-twin-section"
              className="border border-slate-200/90 bg-white/95 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 ga-glass-card ga-stage-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 mr-2">
                  DIGITAL TWIN SIMULATION
                </span>
                <button
                  onClick={() => setIsPlaying(true)}
                  disabled={isPlaying}
                  className={`px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 border transition ${
                    isPlaying
                      ? 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'
                      : 'bg-white border-slate-200 text-[#0d3f3a] hover:bg-emerald-100'
                  }`}
                >
                  <Play className="h-3 w-3" /> Play
                </button>
                <button
                  onClick={() => setIsPlaying(false)}
                  disabled={!isPlaying}
                  className="px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 bg-white border border-slate-200 text-[#0d3f3a] hover:bg-emerald-100 disabled:opacity-40 transition"
                >
                  <Pause className="h-3 w-3" /> Pause
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
                  className="px-2.5 py-1 rounded-2xl text-xs font-mono inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-500 hover:text-[#0d3f3a] transition"
                >
                  ↺ Reset
                </button>
                <span className="h-4 w-px bg-slate-200 mx-1" />
                <span className="text-xs font-mono text-slate-500">Time</span>
                <span className="px-2 py-1 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-[#0d3f3a]">
                  {grid.current_time}
                </span>
                <button
                  onClick={() => handleSelectHour((grid.current_hour + 23) % 24)}
                  className="px-2 py-1 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-[#0d3f3a] hover:bg-emerald-100 transition"
                >
                  - 1h
                </button>
                <button
                  onClick={() => handleSelectHour((grid.current_hour + 1) % 24)}
                  className="px-2 py-1 rounded-2xl bg-white border border-slate-200 text-xs font-mono text-[#0d3f3a] hover:bg-emerald-100 transition"
                >
                  + 1h
                </button>
                <span className="h-4 w-px bg-slate-200 mx-1" />
                <span className="text-xs font-mono text-slate-500">Speed</span>
                <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-0.5">
                  {([1, 2, 5] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 text-xs font-mono rounded-lg transition ${
                        speed === s
                          ? 'bg-emerald-100 text-[#0d3f3a] font-semibold'
                          : 'text-slate-500 hover:text-[#0d3f3a]'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="active-workload-select"
                  className="text-[11px] font-mono text-slate-500"
                >
                  Workload:
                </label>
                <select
                  id="active-workload-select"
                  value={selectedWorkload?.job_id}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-2xl px-2.5 py-1 text-xs font-mono text-[#0d3f3a] focus:outline-none focus:border-[#10B981]"
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
                  className="px-3 py-1 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/50 text-[#10B981] hover:bg-[#10B981]/25 text-xs font-mono font-medium transition disabled:opacity-50"
                >
                  Run Decision
                </button>
              </div>
            </section>
          )}

          {activeNav === 'energy' && (
            <EnergyIntelligence
              grid={grid}
              forecast24h={data.forecast_24h}
              highlightHour={recStart}
              onSelectHour={handleSelectHour}
            />
          )}

          {activeNav === 'simulation' && selectedWorkload && (
            <div className={`ga-stage-3 ${focusClass('twin')}`}>
              <DigitalTwinCanvas
                grid={grid}
                forecast24h={data.forecast_24h}
                workload={selectedWorkload}
                onSelectHour={handleSelectHour}
                demoStep={judgeScene}
              />
            </div>
          )}

          {activeNav === 'impact' && (
            <PageHeroArt
              kind="impact"
              eyebrow="Impact · Before vs after"
              title="Same workload, cleaner execution"
              description="Fixed-schedule baseline against the carbon-aware decision — every kilogram accounted for."
            />
          )}

          {activeNav === 'impact' && (
<<<<<<< HEAD
            <ImpactHero comparison={data.comparison} />
          )}
          {activeNav === 'impact' && (
          <section id="what-if-section" className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between">
              <div>
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">WHAT HAPPENS IF WE RUN THIS WORKLOAD?</h2>
                  <span className="text-[11px] font-mono text-slate-500">{selectedWorkload?.name} ({selectedWorkload?.energy_kwh} kWh)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-11 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  <div className="md:col-span-5 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">RUN NOW</span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">HIGH CARBON</span>
                    </div>
                    <div className="text-2xl font-mono font-bold text-[#0d3f3a]">{submitTime}</div>
                    <div className="space-y-2 pt-2 border-t border-slate-200 text-xs font-mono">
                      <div className="flex justify-between"><span className="text-slate-500">Grid Intensity</span><span className="text-[#EF4444]">{Math.round(baselineCarbonIntensity)} gCO₂/kWh</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Total Carbon</span><span className="text-[#0d3f3a] font-semibold">{baselineKg} kgCO₂</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Energy Cost</span><span className="text-[#0d3f3a]">${baselineCost}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Deadline</span><span className="text-slate-500">{selectedWorkload?.deadline}</span></div>
                    </div>
=======
            <section
              id="what-if-section"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 ga-stage-3"
            >
              {/* Section 10: What-If Visual Polish + Before/After Hero Impact */}
              <div className="lg:col-span-6 border border-slate-200/90 bg-white rounded-2xl flex flex-col justify-between overflow-hidden ga-card-hover ga-glass-card">
                <div>
                  <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
                      WHAT HAPPENS IF WE RUN THIS WORKLOAD?
                    </h2>
                    <span className="text-[11px] font-mono text-slate-500">
                      {selectedWorkload?.name} ({selectedWorkload?.energy_kwh}{' '}
                      kWh)
                    </span>
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-11 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    {/* BEFORE / RUN NOW */}
                    <div className="md:col-span-5 p-5 space-y-3 bg-gradient-to-b from-rose-50/35 to-transparent">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                          BEFORE · RUN NOW
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                          HIGH CARBON
                        </span>
                      </div>
                      <div className="text-2xl font-mono font-bold text-[#0d3f3a]">
                        {submitTime}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-200 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Grid Intensity</span>
                          <span className="text-[#EF4444]">
                            <AnimatedNumber
                              value={baselineCarbonIntensity}
                              decimals={0}
                              suffix=" gCO₂/kWh"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Carbon</span>
                          <span className="text-[#0d3f3a] font-semibold">
                            <AnimatedNumber
                              value={baselineKgNum}
                              decimals={1}
                              suffix=" kgCO₂"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Energy Cost</span>
                          <span className="text-[#0d3f3a]">
                            <AnimatedNumber
                              value={baselineCostNum}
                              decimals={2}
                              prefix="$"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Deadline</span>
                          <span className="text-slate-500">
                            {selectedWorkload?.deadline}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const h = parseInt(submitTime.split(':')[0], 10);
                          if (!Number.isNaN(h)) handleSelectHour(h);
                        }}
                        className="w-full py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-[#0d3f3a] shadow-sm"
                      >
                        RUN NOW ({submitTime})
                      </button>
                    </div>

                    {/* AFTER / WAIT FOR CLEANER WINDOW */}
                    <div className="md:col-span-6 p-5 space-y-3 bg-gradient-to-b from-emerald-50/75 to-teal-50/25">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#10B981]">
                          AFTER · CLEANER WINDOW
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                          CLEAN WINDOW
                        </span>
                      </div>
                      <div className="text-2xl font-mono font-bold text-[#10B981]">
                        {recStart}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-emerald-200/70 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Grid Intensity</span>
                          <span className="text-[#10B981]">
                            <AnimatedNumber
                              value={optimizedCarbonIntensity}
                              decimals={0}
                              suffix=" gCO₂/kWh"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total Carbon</span>
                          <span className="text-[#0d3f3a] font-semibold">
                            <AnimatedNumber
                              value={optimizedKgNum}
                              decimals={1}
                              suffix=" kgCO₂"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Energy Cost</span>
                          <span className="text-[#10B981] font-semibold">
                            <AnimatedNumber
                              value={optimizedCostNum}
                              decimals={2}
                              prefix="$"
                            />
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Savings</span>
                          <span className="text-[#10B981] font-bold">
                            <AnimatedNumber
                              value={carbonReductionPctNum}
                              decimals={1}
                              prefix="-"
                              suffix="% CO₂"
                            />
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          await handleRunDecision();
                          const h = parseInt(recStart.split(':')[0], 10);
                          if (!Number.isNaN(h)) await handleSelectHour(h);
                        }}
                        className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold shadow-md shadow-emerald-600/20"
                      >
                        COMPARE WITH CLEANER TIME ({recStart})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Hero Before/After Impact Strip */}
                <div className="px-5 py-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      VERIFIED CARBON IMPACT
                    </div>
                    <div className="text-xl font-mono font-extrabold text-[#10B981]">
                      <AnimatedNumber
                        value={savedKgNum}
                        decimals={1}
                        suffix=" kg CO₂ saved"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                      REDUCTION
                    </div>
                    <div className="text-xl font-mono font-extrabold text-[#0d3f3a]">
                      <AnimatedNumber
                        value={carbonReductionPctNum}
                        decimals={1}
                        suffix="% LESS CARBON"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 11 & 12: AI Decision + Safety Check Pipeline */}
              <div className="lg:col-span-6 border border-slate-200/90 bg-white rounded-2xl flex flex-col overflow-hidden ga-card-hover ga-glass-card">
                <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
                    GRIDAGENT DECISION &amp; SAFETY CHECK
                  </h2>
                  <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                    {decisionHeadline}
                  </span>
                </div>
                <div className="p-5 space-y-4 text-xs font-mono">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl shadow-sm">
                      <div className="text-slate-500 font-semibold">
                        1. AI DECISION
                      </div>
                      <div className="text-[#0d3f3a] font-bold mt-1">
                        {recStart} window
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {data.forecast_24h.length}h evaluated
                      </div>
                    </div>
                    <div
                      className={`p-3 bg-slate-50 border rounded-2xl transition-shadow ${
                        governanceState === 'ALLOWED'
                          ? 'border-emerald-300 ga-safety-allow'
                          : governanceState === 'ASK USER'
                          ? 'border-amber-300 ga-safety-ask'
                          : 'border-rose-300 ga-safety-block'
                      }`}
                    >
                      <div className="text-[#3B82F6] font-semibold">
                        2. SAFETY CHECK
                      </div>
                      <div className="text-[#0d3f3a] font-bold mt-1">
                        🛡 {governanceState}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        SLA {selectedWorkload?.deadline} PASS
                      </div>
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
                      <div className="text-[#10B981] font-semibold">
                        3. EXECUTION
                      </div>
                      <div className="text-[#0d3f3a] font-bold mt-1">
                        {recStart} selected
                      </div>
                      <div className="text-[#10B981] font-semibold mt-0.5">
                        <AnimatedNumber
                          value={carbonReductionPctNum}
                          decimals={1}
                          prefix="-"
                          suffix="% CO₂"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 11: AI Recommendation Card with subtle glow & reveal */}
                  <div className="rounded-2xl border border-[#10B981]/45 p-4 text-xs ga-ai-rec-card">
                    <div className="font-mono font-bold text-[#0d3f3a] flex items-center justify-between">
                      <span>{decisionHeadline}</span>
                      <span className="h-2 w-2 rounded-full bg-[#10B981] ga-pulse-subtle" />
                    </div>
                    <div className="text-slate-600 mt-1.5 font-sans leading-relaxed">
                      {selectedWorkload?.decision_reason}
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-mono mt-auto">
                  <span className="text-slate-500 uppercase tracking-[0.12em] text-[11px]">
                    SAFETY VALIDATION STATUS
                  </span>
                  {governanceState === 'ALLOWED' && (
                    <span className="text-[#10B981] font-semibold inline-flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5" /> ✓ ALLOWED — Safe to
                      schedule
                    </span>
                  )}
                  {governanceState === 'ASK USER' && (
                    <span className="text-[#F59E0B] font-semibold">
                      ⚠ APPROVAL REQUIRED — Human gate active
                    </span>
                  )}
                  {governanceState === 'BLOCKED' && (
                    <span className="text-[#EF4444] font-semibold">
                      ✕ BLOCKED — Protected service runs immediately
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeNav === 'workloads' && (
            <PageHeroArt
              kind="workloads"
              eyebrow="Workloads · Fleet queue"
              title="Every job, deadline and decision in one queue"
              description="Pick a workload to inspect its carbon math, cost and governance state."
            />
          )}

          {activeNav === 'safety' && (
            <PageHeroArt
              kind="safety"
              eyebrow="Safety · Governance guardrails"
              title="Policy checks before any execution"
              description="ALLOW, ASK_USER and DENY rules with a full audit trail for every ruling."
            />
          )}

          {(activeNav === 'workloads' || activeNav === 'safety') && (
            <section
              id="governance-workloads-section"
              className="grid grid-cols-1 lg:grid-cols-12 gap-5 ga-stage-3"
            >
              {activeNav === 'safety' && (
                <div className="lg:col-span-5 border border-slate-200/90 bg-white rounded-2xl flex flex-col justify-between overflow-hidden ga-card-hover ga-glass-card">
                  <div>
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
                        EXECUTION GOVERNANCE
                      </h2>
                      <span className="text-[11px] font-mono text-slate-500">
                        AI PROPOSES · SAFETY DECIDES
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="text-xs text-slate-500">
                        Selected workload:{' '}
                        <strong className="text-[#0d3f3a] font-mono">
                          {selectedWorkload?.job_id}
                        </strong>
                        {' · '}State:{' '}
                        <strong
                          className={`font-mono ${
                            governanceState === 'ALLOWED'
                              ? 'text-[#10B981]'
                              : governanceState === 'ASK USER'
                              ? 'text-[#F59E0B]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {governanceState}
                        </strong>
                      </div>
                      <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                        <button
                          type="button"
                          title={
                            selectedWorkload
                              ? `Auto-defer ${selectedWorkload.job_id} to ${recStart}`
                              : 'No workload selected'
                          }
                          disabled={
                            busy ||
                            !selectedWorkload ||
                            governanceState === 'BLOCKED'
                          }
                          onClick={() =>
                            selectedWorkload &&
                            withBusy(
                              () =>
                                api.workloadAction(
                                  selectedWorkload.job_id,
                                  'defer',
                                  recStart
                                ),
                              'Deferred ' +
                                selectedWorkload.job_id +
                                ' to ' +
                                recStart
                            )
                          }
                          className={`p-3 rounded-2xl border text-center transition cursor-pointer hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                            governanceState === 'ALLOWED'
                              ? 'bg-[#10B981]/15 border-[#10B981] text-[#10B981] font-bold ga-safety-allow hover:bg-[#10B981]/25'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#10B981] hover:text-[#10B981]'
                          }`}
                        >
                          <div>✓ ALLOWED</div>
                          <div className="text-[10px] font-normal mt-0.5">
                            Auto-defer
                          </div>
                        </button>
                        <button
                          type="button"
                          title={
                            governanceState === 'ASK USER' && selectedWorkload
                              ? `Approve ${selectedWorkload.job_id} (human gate)`
                              : 'Pick an AWAITING_APPROVAL job to approve'
                          }
                          disabled={
                            busy ||
                            !selectedWorkload ||
                            governanceState !== 'ASK USER'
                          }
                          onClick={() =>
                            selectedWorkload &&
                            withBusy(
                              () =>
                                api.workloadAction(
                                  selectedWorkload.job_id,
                                  'approve'
                                ),
                              'Approved ' + selectedWorkload.job_id
                            )
                          }
                          className={`p-3 rounded-2xl border text-center transition cursor-pointer hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                            governanceState === 'ASK USER'
                              ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] font-bold ga-safety-ask hover:bg-[#F59E0B]/25'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#F59E0B] hover:text-[#F59E0B]'
                          }`}
                        >
                          <div>⚠ ASK USER</div>
                          <div className="text-[10px] font-normal mt-0.5">
                            Human gate
                          </div>
                        </button>
                        <button
                          type="button"
                          title="DENY policy — protected services can never be auto-started"
                          onClick={() =>
                            setToastMessage(
                              selectedWorkload
                                ? `${selectedWorkload.job_id} is protected by DENY policy: ${
                                    selectedWorkload.policy_reason ||
                                    'production service — manual review required.'
                                  }`
                                : 'Protected services are BLOCKED by DENY policy.'
                            )
                          }
                          className={`p-3 rounded-2xl border text-center transition cursor-pointer hover:shadow-sm ${
                            governanceState === 'BLOCKED'
                              ? 'bg-[#EF4444]/15 border-[#EF4444] text-[#EF4444] font-bold ga-safety-block hover:bg-[#EF4444]/25'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-[#EF4444] hover:text-[#EF4444]'
                          }`}
                        >
                          <div>✕ BLOCKED</div>
                          <div className="text-[10px] font-normal mt-0.5">
                            Run immediately
                          </div>
                        </button>
                      </div>
                      {governanceState === 'ASK USER' && selectedWorkload && (
                        <div className="flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() =>
                              withBusy(
                                () =>
                                  api.workloadAction(
                                    selectedWorkload.job_id,
                                    'approve'
                                  ),
                                'Approved ' + selectedWorkload.job_id
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-[#10B981] hover:bg-[#0da271] text-white text-xs font-bold transition disabled:opacity-50"
                          >
                            Approve {selectedWorkload.job_id}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() =>
                              withBusy(
                                () =>
                                  api.workloadAction(
                                    selectedWorkload.job_id,
                                    'reject'
                                  ),
                                'Rejected ' + selectedWorkload.job_id
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#EF4444]/40 text-[#EF4444] hover:bg-[#EF4444]/10 text-xs font-bold transition disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {governanceState === 'ALLOWED' && selectedWorkload && (
                        <div className="flex gap-2">
                          <button
                            disabled={busy}
                            onClick={() =>
                              withBusy(
                                () =>
                                  api.workloadAction(
                                    selectedWorkload.job_id,
                                    'defer',
                                    recStart
                                  ),
                                'Deferred ' +
                                  selectedWorkload.job_id +
                                  ' to ' +
                                  recStart
                              )
                            }
                            className="flex-1 px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/25 text-xs font-bold transition disabled:opacity-50"
                          >
                            Defer to {recStart}
                          </button>
                          <button
                            disabled={busy}
                            onClick={handleRunDecision}
                            className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#0d3f3a] text-xs font-bold transition disabled:opacity-50"
                          >
                            Re-run agent check
                          </button>
                        </div>
                      )}
                      {governanceState === 'BLOCKED' && selectedWorkload && (
                        <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#7f1d1d]">
                          Protected by DENY policy —{' '}
                          {selectedWorkload.policy_reason ||
                            'manual review required.'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeNav === 'safety' && (
                <SafetyExtraPanels
                  data={data}
                  selectedJobId={selectedJobId}
                  busy={busy}
                  onSelect={setSelectedJobId}
                  onAction={(id, action, start) =>
                    withBusy(
                      () => api.workloadAction(id, action, start),
                      `Executed ${action} on ${id}`
                    )
                  }
                />
              )}

              {activeNav === 'workloads' && (
                <div className="lg:col-span-12 border border-slate-200/90 bg-white rounded-2xl flex flex-col justify-between overflow-hidden ga-card-hover ga-glass-card">
                  <div>
                    <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
                          Job Queue
                        </h2>
                        <span className="text-[11px] font-mono text-slate-500">
                          {data.workloads.length} workloads
                        </span>
                      </div>
                      <button
                        onClick={() => setSubmitModalOpen(true)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#10B981] hover:bg-[#0EA5E9] text-white text-xs font-bold transition shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" /> New Job
                      </button>
                    </div>
                    <div className="divide-y divide-slate-200">
                      {data.workloads.map((job) => (
                        <button
                          key={job.job_id}
                          onClick={() => setSelectedJobId(job.job_id)}
                          className={`px-5 py-3 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition w-full text-left ${
                            selectedJobId === job.job_id
                              ? 'bg-emerald-100/80'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  job.status === 'RUNNING'
                                    ? 'bg-emerald-500 animate-ping'
                                    : job.status === 'BLOCKED'
                                    ? 'bg-rose-500'
                                    : job.status === 'DEFERRED'
                                    ? 'bg-amber-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span className="text-xs font-semibold text-[#0d3f3a]">
                                {job.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-500">
                                ({job.energy_kwh} kWh · SLA {job.deadline} ·{' '}
                                {job.status})
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 pl-4">
                              {job.decision_reason}
                            </div>
                          </div>
                          <span className="text-[#0d3f3a] font-mono text-xs w-24 text-right font-semibold">
                            {job.recommended_start_time ||
                              job.submitted_at_time}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs font-mono text-slate-500">
                    Fleet Savings:{' '}
                    <strong className="text-[#10B981]">
                      <AnimatedNumber
                        value={data.comparison.total_carbon_saved_gco2 / 1000}
                        decimals={1}
                        suffix=" kg CO₂"
                      />
                    </strong>{' '}
                    (-
                    <AnimatedNumber
                      value={data.comparison.carbon_reduction_percentage}
                      decimals={1}
                      suffix="%"
                    />
                    )
                  </div>
                </div>
              )}
            </section>
          )}

          {viewMode === 'technical' && (
            <section
              id="technical-details-section"
              className="space-y-5 pt-4 border-t border-slate-200 ga-stage-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-mono font-bold uppercase tracking-[0.14em] text-[#0d3f3a]">
                    TECHNICAL ARCHITECTURE &amp; TELEMETRY
                  </h2>
                  <p className="text-xs text-slate-500">Scoped to this page.</p>
                </div>
                <button
                  onClick={() => setViewMode('simple')}
                  className="px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 hover:text-[#0d3f3a]"
                >
                  Switch to Simple View
                </button>
              </div>
              {(activeNav === 'workloads' || activeNav === 'dashboard') && (
                <WorkloadTable
                  workloads={data.workloads}
                  busy={busy}
                  onAction={(id, action) =>
                    withBusy(
                      () => api.workloadAction(id, action),
                      `Executed ${action} on ${id}`
                    )
                  }
                />
              )}
              {(activeNav === 'impact' || activeNav === 'dashboard') && (
                <BeforeAfterComparison comparison={data.comparison} />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(activeNav === 'simulation' || activeNav === 'dashboard') && (
                  <AgentActivityFeed events={data.agent_events} />
                )}
                {(activeNav === 'safety' || activeNav === 'dashboard') && (
                  <SafetyAndMcpPanel
                    policyRules={data.policy_rules}
                    auditLogs={data.policy_audit_logs}
                    mcpTools={data.mcp_tools}
                  />
                )}
              </div>
            </section>
          )}
        </main>
      </div>

      <SubmitWorkloadModal
        isOpen={submitModalOpen}
        currentCarbon={data.grid_status.carbon_intensity_gco2_kwh}
        currentSolar={data.grid_status.solar_generation_mw}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitJob={async (payload) => {
          await withBusy(async () => {
            await api.submitWorkload(payload);
          }, `Submitted workload '${payload.name}'.`);
        }}
        onOverrideGrid={async (payload) => {
          await withBusy(async () => {
            await api.updateSimulation(payload);
          }, `Applied grid override.`);
        }}
      />
    </div>
  );
};
