import React, { useState } from 'react';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';
import {
  AnimatedNumber,
  JUDGE_MODE_SCENES,
  usePrefersReducedMotion,
} from './motion';

interface DigitalTwinCanvasProps {
  grid: GridStatus;
  forecast24h: GridHourlyPoint[];
  workload: WorkloadJob;
  onSelectHour: (hour: number) => void;
  demoStep?: number | null;
}

type HoverNode = 'solar' | 'grid' | 'datacenter' | 'workload' | 'reschedule' | null;

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  grid,
  forecast24h,
  workload,
  onSelectHour,
  demoStep,
}) => {
  const reducedMotion = usePrefersReducedMotion();
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [highlightWorkloadPath, setHighlightWorkloadPath] =
    useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<HoverNode>(null);

  // Section 15: Subtle 3-layer mouse parallax (max ~3-8px)
  const [mouseOffset, setMouseOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  const currentHour = grid.current_hour;
  const carbon = grid.carbon_intensity_gco2_kwh;
  const renewable = grid.renewable_percentage;
  const solarMw = grid.solar_generation_mw;
  const windMw = grid.wind_generation_mw;

  const isHighCarbon = carbon >= 550;
  const isCleanCarbon = carbon <= 420;

  const recStartStr = workload.recommended_start_time || '17:00';
  const recHour = parseInt(recStartStr.split(':')[0], 10);
  const deadlineStr = workload.deadline || '20:00';
  const deadlineHour = parseInt(deadlineStr.split(':')[0], 10);
  const submitTimeStr = workload.submitted_at_time || '15:00';
  const submitHour = parseInt(submitTimeStr.split(':')[0], 10);

  const isExecutingAtCurrentHour =
    workload.status === 'RUNNING' ||
    (workload.decision === 'DEFER' && currentHour === recHour) ||
    (workload.decision === 'RUN_NOW' && currentHour === submitHour);

  const isDeferredWaiting =
    workload.decision === 'DEFER' && currentHour < recHour;

  const governanceState: 'ALLOWED' | 'ASK USER' | 'BLOCKED' =
    workload.policy_decision === 'DENY' ||
    workload.status === 'BLOCKED' ||
    workload.is_protected_service
      ? 'BLOCKED'
      : workload.policy_decision === 'ASK_USER' ||
        workload.status === 'AWAITING_APPROVAL'
      ? 'ASK USER'
      : 'ALLOWED';

  // Semantic colors: Green = clean/safe, Amber = moderate, Red = high carbon/blocked, Blue = infrastructure
  const gridStateColor = isCleanCarbon
    ? '#10B981'
    : isHighCarbon
    ? '#EF4444'
    : '#F59E0B';

  const gridStateText = isCleanCarbon
    ? 'CLEAN WINDOW'
    : isHighCarbon
    ? 'HIGH CARBON'
    : 'MODERATE CARBON';

  const atmosphereClass = isCleanCarbon
    ? 'ga-twin-atmosphere-clean'
    : isHighCarbon
    ? 'ga-twin-atmosphere-high'
    : 'ga-twin-atmosphere-moderate';

  // Compute node visualization (12 nodes: 2 rows of 6)
  const activeNodesCount = isExecutingAtCurrentHour
    ? 10
    : Math.max(3, Math.round((grid.cloud_capacity_utilization_pct / 100) * 12));

  // Particle flow speed scales with renewable availability & active state
  const solarFlowDur =
    renewable >= 40 ? '1.3s' : renewable >= 25 ? '2.0s' : '2.8s';
  const gridFlowDur = isExecutingAtCurrentHour ? '1.2s' : '1.9s';

  const hoveredPoint =
    hoveredHour !== null
      ? forecast24h.find((p) => p.hour === hoveredHour) || null
      : null;

  const inspectedPoint =
    hoveredPoint ||
    forecast24h.find((p) => p.hour === currentHour) ||
    forecast24h[0] ||
    null;

  const activeJudgeScene =
    demoStep !== null && demoStep !== undefined
      ? JUDGE_MODE_SCENES.find((s) => s.scene === demoStep) || null
      : null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseOffset({ x: nx, y: ny });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
    setHoveredNode(null);
  };

  // Keep subtle parallax strictly on the non-interactive background grid so interactive SVG nodes never shift under the cursor
  const bgTransform = reducedMotion
    ? undefined
    : `translate3d(${(mouseOffset.x * 2.5).toFixed(1)}px, ${(
        mouseOffset.y * 2.5
      ).toFixed(1)}px, 0)`;
  const twinTransform = undefined;
  const fgTransform = undefined;

  return (
    <div className="bg-white/95 border border-slate-200/90 rounded-2xl overflow-hidden shadow-lg ga-twin-surface ga-glass-card">
      {/* =====================================================================
          HEADER BAR: DIGITAL TWIN STATUS & REAL-TO-TWIN SYNCHRONIZATION
      ===================================================================== */}
      <div className="px-5 py-3 border-b border-slate-200/80 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-[#0d3f3a]">
            DIGITAL TWIN
          </h2>

          {/* Honest Simulation vs Live Grid Indicator */}
          {grid.is_simulated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/90 shadow-sm text-[11px] font-mono text-[#0d3f3a]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] ga-pulse-subtle" />
              ● SIMULATION MODE
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 shadow-sm text-[11px] font-mono font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-ping" />
              ● LIVE GRID ({grid.data_source})
            </span>
          )}

          {/* Subtle Live Sync Pipeline */}
          <div className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 border-l border-slate-200 pl-3">
            <span className="text-[#0d3f3a] font-semibold">
              {grid.is_simulated ? 'SIMULATION' : 'LIVE GRID'}
            </span>
            <span className="text-emerald-600">→</span>
            <span>DIGITAL TWIN</span>
            <span className="text-emerald-600">→</span>
            <span className="text-emerald-700 font-semibold">
              SYNCHRONIZED ✓
            </span>
          </div>
        </div>

        {/* Subtle Real System -> Digital Twin Mapping */}
        <div className="hidden xl:flex items-center gap-3 text-[11px] font-mono text-slate-500">
          <span>
            Workload <span className="text-[#3B82F6]">→</span> Twin Model
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Grid <span className="text-[#3B82F6]">→</span>{' '}
            <AnimatedNumber value={carbon} decimals={0} suffix=" gCO₂" />
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Renewables <span className="text-[#10B981]">→</span>{' '}
            <AnimatedNumber value={renewable} decimals={1} suffix="%" />
          </span>
        </div>
      </div>

      {/* =====================================================================
          MAIN DIGITAL TWIN ENGINEERING SCHEMATIC CANVAS
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
        {/* LEFT COLUMN (3 cols): REAL SYSTEM VS DIGITAL TWIN MODEL + TELEMETRY */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 flex flex-col justify-between bg-gradient-to-b from-slate-50/90 to-white">
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                SIMULATION CLOCK
              </div>
              <div className="mt-1 flex items-baseline gap-2.5">
                <span className="text-2xl font-mono font-semibold text-[#0d3f3a]">
                  {grid.current_time}
                </span>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors duration-500 shadow-sm"
                  style={{
                    color: gridStateColor,
                    borderColor: `${gridStateColor}45`,
                    backgroundColor: `${gridStateColor}14`,
                  }}
                >
                  {gridStateText}
                </span>
              </div>
            </div>

            {/* Real System -> Digital Twin Mapping Table */}
            <div className="pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200/70">
                <span>PARAMETER</span>
                <span className="text-right">LIVE TWIN STATE</span>
              </div>
              <div className="divide-y divide-slate-200/80 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Cloud workload</span>
                  <span className="font-mono text-[#0d3f3a] font-medium">
                    {workload.job_id}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Carbon intensity</span>
                  <span
                    className="font-mono font-semibold transition-colors duration-500"
                    style={{ color: gridStateColor }}
                  >
                    <AnimatedNumber
                      value={carbon}
                      decimals={0}
                      suffix=" gCO₂/kWh"
                    />
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Renewable share</span>
                  <span className="font-mono text-[#10B981] font-semibold">
                    <AnimatedNumber
                      value={renewable}
                      decimals={1}
                      suffix="%"
                    />{' '}
                    (
                    <AnimatedNumber
                      value={solarMw + windMw}
                      decimals={0}
                      suffix=" MW"
                    />
                    )
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Workload status</span>
                  <span
                    className={`font-mono font-semibold transition-colors duration-300 ${
                      isExecutingAtCurrentHour
                        ? 'text-[#10B981]'
                        : isDeferredWaiting
                        ? 'text-amber-600'
                        : 'text-[#3B82F6]'
                    }`}
                  >
                    {isExecutingAtCurrentHour
                      ? 'RUNNING NOW'
                      : isDeferredWaiting
                      ? `WAIT → ${recStartStr}`
                      : workload.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Workload Entity Card (Hover highlights path in Digital Twin) */}
          <div
            onMouseEnter={() => setHighlightWorkloadPath(true)}
            onMouseLeave={() => setHighlightWorkloadPath(false)}
            className="mt-6 pt-4 border-t border-slate-200 space-y-2 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
                TARGET WORKLOAD ENTITY
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md border transition-shadow ${
                  governanceState === 'ALLOWED'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 ga-safety-allow'
                    : governanceState === 'ASK USER'
                    ? 'bg-amber-50 border-amber-300 text-amber-700 ga-safety-ask'
                    : 'bg-rose-50 border-rose-300 text-rose-700 ga-safety-block'
                }`}
              >
                {governanceState === 'ALLOWED'
                  ? '✓ SAFE TO WAIT'
                  : governanceState === 'ASK USER'
                  ? '⚠ APPROVAL REQ'
                  : '✕ PROTECTED'}
              </span>
            </div>
            <div className="text-sm font-semibold text-[#0d3f3a]">
              {workload.name}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
              <div className="bg-white border border-slate-200/90 shadow-sm px-2.5 py-1.5 rounded-xl">
                <div className="text-slate-500 text-[10px]">ENERGY DRAW</div>
                <div className="text-[#0d3f3a] font-semibold">
                  {workload.energy_kwh} kWh
                </div>
              </div>
              <div className="bg-white border border-slate-200/90 shadow-sm px-2.5 py-1.5 rounded-xl">
                <div className="text-slate-500 text-[10px]">SLA DEADLINE</div>
                <div className="text-[#0d3f3a] font-semibold">
                  {workload.deadline}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT COLUMN (9 cols): TECHNICAL CAD / TOPOLOGY VISUALIZATION */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`lg:col-span-9 p-4 md:p-6 relative flex flex-col justify-center overflow-hidden ga-twin-surface ${atmosphereClass}`}
        >
          {/* Layer 1 Parallax: Subtle technical blueprint grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40 transition-transform duration-200 ease-out"
            style={{
              backgroundImage:
                'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              transform: bgTransform,
            }}
          />

          {/* Layer 2 Parallax: SVG Technical Schematic: SOLAR -> ENERGY GRID -> DATA CENTER -> WORKLOAD */}
          <div
            className="relative z-10 w-full transition-transform duration-200 ease-out"
            style={{ transform: twinTransform }}
          >
            <svg
              viewBox="0 0 880 400"
              className="w-full h-auto max-h-[400px] select-none"
              role="img"
              aria-label="Digital Twin Infrastructure Topology: Solar and Wind Generation to Energy Grid to Data Center to Workload"
            >
              <defs>
                <filter
                  id="cardShadow"
                  x="-12%"
                  y="-12%"
                  width="124%"
                  height="134%"
                >
                  <feDropShadow
                    dx="0"
                    dy="5"
                    stdDeviation="7"
                    floodColor="#0F172A"
                    floodOpacity="0.08"
                  />
                </filter>
                <filter
                  id="nodeGlowGreen"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="3"
                    stdDeviation="5"
                    floodColor="#10B981"
                    floodOpacity="0.24"
                  />
                </filter>
                <filter
                  id="particleGlow"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feGaussianBlur stdDeviation="1.6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <marker
                  id="arrow-blue"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#3B82F6" />
                </marker>
                <marker
                  id="arrow-green"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#10B981" />
                </marker>
                <marker
                  id="arrow-state"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill={gridStateColor} />
                </marker>

                {/* Motion paths for electricity particles */}
                <path id="path-solar-grid" d="M 440 76 L 440 108" />
                <path id="path-grid-dc" d="M 440 178 L 440 212" />
                <path id="path-dc-workload" d="M 440 316 L 440 346" />
                <path
                  id="path-reschedule-arc"
                  d="M 108 212 C 108 265, 165 265, 226 265"
                />
              </defs>

              {/* =============================================================
                  STAGE 1 (TOP): RENEWABLE GENERATION (SOLAR + WIND)
              ============================================================= */}
              <g
                transform="translate(290, 12)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('solar')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="300"
                  height="64"
                  rx="8"
                  fill="#FFFFFF"
                  filter={
                    hoveredNode === 'solar' || renewable >= 35
                      ? 'url(#nodeGlowGreen)'
                      : 'url(#cardShadow)'
                  }
                  stroke={
                    hoveredNode === 'solar' || renewable >= 35
                      ? '#10B981'
                      : '#CBD5E1'
                  }
                  strokeWidth={
                    hoveredNode === 'solar' || renewable >= 35 ? '2' : '1.2'
                  }
                />
                {/* Technical Corner Ticks */}
                <path
                  d="M 0 10 L 0 0 L 10 0 M 290 0 L 300 0 L 300 10"
                  stroke="#10B981"
                  strokeWidth="1.8"
                  fill="none"
                />

                {/* Solar Schematic Icon with subtle intensity ring */}
                <g transform="translate(18, 16)">
                  <circle
                    cx="16"
                    cy="16"
                    r={renewable >= 35 ? '13.5' : '10'}
                    fill="#10B981"
                    fillOpacity={renewable >= 35 ? '0.18' : '0.08'}
                    className={!reducedMotion ? 'ga-breathing-led' : ''}
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="7.5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.6"
                  />
                  <line
                    x1="16"
                    y1="2"
                    x2="16"
                    y2="6"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="16"
                    y1="26"
                    x2="16"
                    y2="30"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="2"
                    y1="16"
                    x2="6"
                    y2="16"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                  <line
                    x1="26"
                    y1="16"
                    x2="30"
                    y2="16"
                    stroke="#10B981"
                    strokeWidth="1.5"
                  />
                </g>

                <text
                  x="62"
                  y="25"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  letterSpacing="1.2"
                >
                  SOLAR + WIND GENERATION
                </text>
                <text
                  x="62"
                  y="46"
                  fill="#0F172A"
                  fontSize="14"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {renewable.toFixed(1)}% Renewable
                </text>
                <text
                  x="208"
                  y="46"
                  fill="#10B981"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {Math.round(solarMw)} MW PV
                </text>
              </g>

              {/* Flow Line 1: SOLAR -> ENERGY GRID + Animated Energy Particles */}
              <g>
                <line
                  x1="440"
                  y1="76"
                  x2="440"
                  y2="108"
                  stroke="#10B981"
                  strokeOpacity={hoveredNode === 'solar' ? '0.35' : '0.18'}
                  strokeWidth="6"
                />
                <line
                  x1="440"
                  y1="76"
                  x2="440"
                  y2="104"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow-green)"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="16"
                      to="0"
                      dur={solarFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                {/* Clean Energy Particles scaling with renewable share */}
                {!reducedMotion && (
                  <>
                    <circle
                      r="3.4"
                      fill="#10B981"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={solarFlowDur}
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-solar-grid" />
                      </animateMotion>
                    </circle>
                    {renewable >= 30 && (
                      <circle
                        r="2.8"
                        fill="#10B981"
                        opacity="0.8"
                        filter="url(#particleGlow)"
                      >
                        <animateMotion
                          dur={solarFlowDur}
                          begin="0.65s"
                          repeatCount="indefinite"
                        >
                          <mpath href="#path-solar-grid" />
                        </animateMotion>
                      </circle>
                    )}
                  </>
                )}
              </g>

              {/* =============================================================
                  STAGE 2: ENERGY GRID SUBSTATION
              ============================================================= */}
              <g
                transform="translate(290, 110)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('grid')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="300"
                  height="68"
                  rx="8"
                  fill="#FFFFFF"
                  filter="url(#cardShadow)"
                  stroke={gridStateColor}
                  strokeWidth={hoveredNode === 'grid' ? '2.2' : '1.6'}
                />
                <text
                  x="20"
                  y="24"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  letterSpacing="1.2"
                >
                  ENERGY GRID
                </text>
                <text
                  x="280"
                  y="24"
                  textAnchor="end"
                  fill={gridStateColor}
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  ● {gridStateText}
                </text>
                <text
                  x="20"
                  y="49"
                  fill="#0F172A"
                  fontSize="17"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {Math.round(carbon)} gCO₂/kWh
                </text>
                <text
                  x="280"
                  y="49"
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="12"
                  fontFamily="monospace"
                >
                  ${grid.electricity_price_usd_kwh.toFixed(3)}/kWh
                </text>
              </g>

              {/* Flow Line 2: ENERGY GRID -> DATA CENTER + Particles */}
              <g>
                <line
                  x1="440"
                  y1="178"
                  x2="440"
                  y2="210"
                  stroke={gridStateColor}
                  strokeOpacity="0.2"
                  strokeWidth="6"
                />
                <line
                  x1="440"
                  y1="178"
                  x2="440"
                  y2="206"
                  stroke={gridStateColor}
                  strokeWidth="2.2"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrow-state)"
                >
                  {!reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="16"
                      to="0"
                      dur={gridFlowDur}
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                {!reducedMotion && (
                  <>
                    <circle
                      r="3.4"
                      fill={gridStateColor}
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={gridFlowDur}
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-grid-dc" />
                      </animateMotion>
                    </circle>
                    <circle
                      r="2.4"
                      fill={gridStateColor}
                      opacity="0.7"
                      filter="url(#particleGlow)"
                    >
                      <animateMotion
                        dur={gridFlowDur}
                        begin="0.6s"
                        repeatCount="indefinite"
                      >
                        <mpath href="#path-grid-dc" />
                      </animateMotion>
                    </circle>
                  </>
                )}
              </g>

              {/* =============================================================
                  STAGE 3: DATA CENTER INFRASTRUCTURE (ISOMETRIC / CAD CLUSTER)
              ============================================================= */}
              <g
                transform="translate(230, 212)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('datacenter')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="420"
                  height="104"
                  rx="8"
                  fill="#FFFFFF"
                  filter={
                    highlightWorkloadPath ||
                    hoveredNode === 'datacenter' ||
                    isExecutingAtCurrentHour
                      ? 'url(#nodeGlowGreen)'
                      : 'url(#cardShadow)'
                  }
                  stroke={
                    highlightWorkloadPath || hoveredNode === 'datacenter'
                      ? '#10B981'
                      : isExecutingAtCurrentHour
                      ? '#10B981'
                      : '#3B82F6'
                  }
                  strokeWidth={
                    highlightWorkloadPath || hoveredNode === 'datacenter'
                      ? '2.2'
                      : '1.5'
                  }
                />
                <text
                  x="20"
                  y="22"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  letterSpacing="1.2"
                >
                  DATA CENTER · COOLING NOMINAL
                </text>
                <text
                  x="400"
                  y="22"
                  textAnchor="end"
                  fill="#0F172A"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  Power {workload.energy_kwh} kWh · Load{' '}
                  {Math.round(grid.cloud_capacity_utilization_pct)}%
                </text>

                {/* 2 Rows of 6 Compute Nodes (N-01 to N-12) with subtle breathing LEDs */}
                {Array.from({ length: 12 }).map((_, idx) => {
                  const row = Math.floor(idx / 6);
                  const col = idx % 6;
                  const nx = 20 + col * 64;
                  const ny = 34 + row * 30;
                  const isNodeActive = idx < activeNodesCount;
                  const nodeStroke = isNodeActive
                    ? isCleanCarbon
                      ? '#10B981'
                      : '#3B82F6'
                    : '#CBD5E1';
                  const nodeFill = isNodeActive
                    ? isCleanCarbon
                      ? '#10B98116'
                      : '#3B82F614'
                    : '#F8FAFC';

                  return (
                    <g key={idx} transform={`translate(${nx}, ${ny})`}>
                      <rect
                        x="0"
                        y="0"
                        width="52"
                        height="22"
                        rx="3.5"
                        fill={nodeFill}
                        stroke={nodeStroke}
                        strokeWidth="1.2"
                      />
                      {/* Status LED bar */}
                      <rect
                        x="5"
                        y="5"
                        width="6"
                        height="12"
                        rx="1.5"
                        fill={
                          isNodeActive
                            ? isCleanCarbon
                              ? '#10B981'
                              : '#3B82F6'
                            : '#CBD5E1'
                        }
                        className={
                          isNodeActive && !reducedMotion
                            ? 'ga-breathing-led'
                            : ''
                        }
                      />
                      <text
                        x="16"
                        y="14"
                        fill={isNodeActive ? '#0F172A' : '#64748B'}
                        fontSize="9"
                        fontWeight={isNodeActive ? '600' : '400'}
                        fontFamily="monospace"
                      >
                        N-{String(idx + 1).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Flow Line 3: DATA CENTER -> WORKLOAD */}
              <g>
                <line
                  x1="440"
                  y1="316"
                  x2="440"
                  y2="346"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#3B82F6'}
                  strokeOpacity="0.2"
                  strokeWidth="6"
                />
                <line
                  x1="440"
                  y1="316"
                  x2="440"
                  y2="342"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#3B82F6'}
                  strokeWidth="2.2"
                  strokeDasharray={isExecutingAtCurrentHour ? '4 4' : '2 4'}
                  markerEnd={
                    isExecutingAtCurrentHour
                      ? 'url(#arrow-green)'
                      : 'url(#arrow-blue)'
                  }
                >
                  {isExecutingAtCurrentHour && !reducedMotion && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="16"
                      to="0"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </line>
                {!reducedMotion && (
                  <circle
                    r={isExecutingAtCurrentHour ? '3.4' : '2.6'}
                    fill={isExecutingAtCurrentHour ? '#10B981' : '#3B82F6'}
                    opacity={isExecutingAtCurrentHour ? '1' : '0.65'}
                    filter="url(#particleGlow)"
                  >
                    <animateMotion
                      dur={isExecutingAtCurrentHour ? '1s' : '2.1s'}
                      repeatCount="indefinite"
                    >
                      <mpath href="#path-dc-workload" />
                    </animateMotion>
                  </circle>
                )}
              </g>

              {/* =============================================================
                  STAGE 4 (BOTTOM): WORKLOAD EXECUTION TARGET
              ============================================================= */}
              <g
                transform="translate(250, 346)"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredNode('workload')}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <rect
                  x="0"
                  y="0"
                  width="380"
                  height="42"
                  rx="8"
                  fill="#FFFFFF"
                  filter={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? 'url(#nodeGlowGreen)'
                      : 'url(#cardShadow)'
                  }
                  stroke={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#F59E0B'
                      : '#CBD5E1'
                  }
                  strokeWidth={
                    isExecutingAtCurrentHour || hoveredNode === 'workload'
                      ? '2'
                      : '1.6'
                  }
                />
                <circle
                  cx="20"
                  cy="21"
                  r="4.5"
                  fill={
                    isExecutingAtCurrentHour
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#F59E0B'
                      : '#3B82F6'
                  }
                  className={!reducedMotion ? 'ga-breathing-led' : ''}
                />
                <text
                  x="34"
                  y="25"
                  fill="#0F172A"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="monospace"
                >
                  {workload.name.toUpperCase()}
                </text>
                <text
                  x="362"
                  y="25"
                  textAnchor="end"
                  fill={
                    isExecutingAtCurrentHour
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#D97706'
                      : '#64748B'
                  }
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {isExecutingAtCurrentHour
                    ? `● RUNNING (${grid.current_time})`
                    : isDeferredWaiting
                    ? `⏳ DEFERRED → ${recStartStr}`
                    : `SCHEDULED ${recStartStr}`}
                </text>
              </g>

              {/* =============================================================
                  LAYER 3 FOREGROUND PARALLAX: RESCHEDULING & TELEMETRY CALLOUTS
              ============================================================= */}
              <g transform={fgTransform}>
                {/* LEFT CALLOUT: WORKLOAD RESCHEDULING & SAFETY SHIELD */}
                <g
                  transform="translate(14, 110)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredNode('reschedule')}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  <rect
                    x="0"
                    y="0"
                    width="194"
                    height="104"
                    rx="8"
                    fill="#FFFFFF"
                    filter={
                      demoStep === 6 ||
                      demoStep === 7 ||
                      hoveredNode === 'reschedule'
                        ? 'url(#nodeGlowGreen)'
                        : 'url(#cardShadow)'
                    }
                    stroke={
                      demoStep === 6 ||
                      demoStep === 7 ||
                      hoveredNode === 'reschedule'
                        ? '#10B981'
                        : '#CBD5E1'
                    }
                    strokeWidth={
                      demoStep === 6 ||
                      demoStep === 7 ||
                      hoveredNode === 'reschedule'
                        ? '2'
                        : '1.2'
                    }
                  />
                  <text
                    x="14"
                    y="20"
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="1"
                  >
                    RESCHEDULING &amp; SAFETY
                  </text>
                  <text
                    x="14"
                    y="42"
                    fill="#0F172A"
                    fontSize="13"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {submitTimeStr} ───► {recStartStr}
                  </text>
                  <text
                    x="14"
                    y="62"
                    fill="#10B981"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    -{workload.carbon_reduction_pct.toFixed(1)}% Carbon Impact
                  </text>
                  <rect
                    x="14"
                    y="72"
                    width="166"
                    height="22"
                    rx="5"
                    fill={
                      governanceState === 'ALLOWED'
                        ? '#ECFDF5'
                        : governanceState === 'ASK USER'
                        ? '#FFFBEB'
                        : '#FEF2F2'
                    }
                    stroke={
                      governanceState === 'ALLOWED'
                        ? '#10B98166'
                        : governanceState === 'ASK USER'
                        ? '#F59E0B66'
                        : '#EF444466'
                    }
                  />
                  <text
                    x="97"
                    y="87"
                    textAnchor="middle"
                    fill={
                      governanceState === 'ALLOWED'
                        ? '#047857'
                        : governanceState === 'ASK USER'
                        ? '#B45309'
                        : '#B91C1C'
                    }
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {governanceState === 'ALLOWED'
                      ? '🛡 ✓ SAFE TO WAIT'
                      : governanceState === 'ASK USER'
                      ? '🛡 ⚠ APPROVAL REQ'
                      : '🛡 ✕ BLOCKED'}
                  </text>
                </g>

                {/* Animated connection from Rescheduling Callout into Data Center */}
                <path
                  d="M 108 214 C 108 264, 170 264, 228 264"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={hoveredNode === 'reschedule' ? '2.2' : '1.6'}
                  strokeDasharray="4 4"
                  opacity={hoveredNode === 'reschedule' ? '0.95' : '0.75'}
                />
                {!reducedMotion && (
                  <circle
                    r="3.2"
                    fill="#10B981"
                    filter="url(#particleGlow)"
                  >
                    <animateMotion dur="2.1s" repeatCount="indefinite">
                      <mpath href="#path-reschedule-arc" />
                    </animateMotion>
                  </circle>
                )}

                {/* RIGHT CALLOUT: SYSTEM TELEMETRY SUMMARY */}
                <g transform="translate(674, 110)">
                  <rect
                    x="0"
                    y="0"
                    width="192"
                    height="104"
                    rx="8"
                    fill="#FFFFFF"
                    filter="url(#cardShadow)"
                    stroke="#CBD5E1"
                    strokeWidth="1.2"
                  />
                  <text
                    x="14"
                    y="20"
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                    letterSpacing="1"
                  >
                    LIVE GENERATION MIX
                  </text>
                  <text
                    x="14"
                    y="42"
                    fill="#0F172A"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    ☀ Solar: {Math.round(solarMw)} MW
                  </text>
                  <text
                    x="14"
                    y="62"
                    fill="#0F172A"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    ≋ Wind: {Math.round(windMw)} MW
                  </text>
                  <text
                    x="14"
                    y="82"
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ⚡ Demand: {Math.round(grid.demand_mw)} MW
                  </text>
                  <text
                    x="14"
                    y="96"
                    fill="#10B981"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    SLA: {workload.deadline}
                  </text>
                </g>
              </g>
            </svg>
          </div>

          {/* Cinematic Judge Mode Scene Banner inside Canvas when active */}
          {activeJudgeScene && (
            <div className="mt-3 px-4 py-3 bg-white/95 backdrop-blur-md border border-emerald-400 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono font-bold text-[11px]">
                  SCENE {activeJudgeScene.scene} / 10
                </span>
                <div>
                  <div className="font-bold text-[#0d3f3a] text-sm">
                    {activeJudgeScene.title}
                  </div>
                  <div className="text-slate-600 text-xs">
                    {activeJudgeScene.subtitle}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                {submitTimeStr} ───► {recStartStr}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE TIME SIMULATION TIMELINE (SECTION 9 & 24)
      ===================================================================== */}
      <div className="p-5 bg-white relative">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0d3f3a]">
              24-HOUR INTERACTIVE ENERGY TIMELINE
            </span>
            <span className="text-xs text-slate-500">
              Drag the time slider or hover any hour to inspect grid state &amp;
              reschedule trajectory
            </span>
          </div>

          {/* Legend Markers: NOW, BEST WINDOW, DEADLINE */}
          <div className="flex flex-wrap items-center gap-5 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#0d3f3a] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3B82F6] shadow-[0_0_8px_rgba(59,130,246,0.45)]" />
              NOW ({grid.current_time})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#10B981] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.55)]" />
              BEST WINDOW ({recStartStr})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#F59E0B] font-semibold">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
              DEADLINE ({deadlineStr})
            </span>
          </div>
        </div>

        {/* Section 24: Signature Visual Moment — Rescheduling Trajectory Bar */}
        {workload.decision === 'DEFER' && (
          <div className="mb-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-50/60 via-emerald-50/80 to-emerald-100/60 border border-emerald-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-semibold">
                WORKLOAD RESCHEDULE PATH:
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 border border-rose-200 text-rose-700 font-semibold">
                {submitTimeStr} ({Math.round(workload.current_carbon_intensity ?? 700)} gCO₂)
              </span>
              <span className="text-emerald-600 font-bold">───────►</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-600 text-white font-semibold shadow-sm">
                {recStartStr} ({Math.round(workload.predicted_carbon_intensity ?? 390)} gCO₂)
              </span>
            </div>
            <span className="text-emerald-700 font-semibold">
              ✓ SLA Deadline ({deadlineStr}) Satisfied · -{workload.carbon_reduction_pct.toFixed(1)}% Carbon
            </span>
          </div>
        )}

        {/* Physical Range Slider for smooth scrubbing */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500 w-12">
            00:00
          </span>
          <input
            type="range"
            min={0}
            max={23}
            value={currentHour}
            onChange={(e) => onSelectHour(Number(e.target.value))}
            aria-label="Simulation Time Cursor"
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#10B981]"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12 text-right">
            23:00
          </span>
        </div>

        {/* Persistent Inspector Bar (never mounts/unmounts on hover — zero layout shift) */}
        {inspectedPoint && (
          <div className="mb-3 px-4 py-2.5 min-h-[42px] rounded-xl bg-[#0d3f3a]/95 backdrop-blur-md text-white shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono pointer-events-none select-none">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-300/75">
                {hoveredPoint ? 'INSPECTING' : 'ACTIVE HOUR'}
              </span>
              <span className="text-sm font-bold text-emerald-300">
                {inspectedPoint.time_str}
              </span>
              {inspectedPoint.hour === recHour && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                  ★ BEST WINDOW
                </span>
              )}
              {inspectedPoint.hour === currentHour && (
                <span className="px-2 py-0.5 rounded-full bg-sky-400 text-slate-950 font-bold text-[10px]">
                  ● CURRENT TIME
                </span>
              )}
              {inspectedPoint.hour === deadlineHour && (
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
                  SLA DEADLINE
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <span>
                Carbon:{' '}
                <strong
                  className={
                    inspectedPoint.carbon_intensity_gco2_kwh <= 420
                      ? 'text-emerald-300'
                      : inspectedPoint.carbon_intensity_gco2_kwh >= 550
                      ? 'text-rose-300'
                      : 'text-amber-300'
                  }
                >
                  {Math.round(inspectedPoint.carbon_intensity_gco2_kwh)} gCO₂/kWh
                </strong>
              </span>
              <span>
                Renewable:{' '}
                <strong className="text-emerald-300">
                  {Math.round(inspectedPoint.renewable_percentage)}%
                </strong>
              </span>
              <span>
                Price:{' '}
                <strong className="text-white">
                  ${inspectedPoint.electricity_price_usd_kwh.toFixed(3)}/kWh
                </strong>
              </span>
              <span className="text-emerald-200/80 text-[11px]">
                {hoveredPoint
                  ? `Click to jump Digital Twin to ${hoveredPoint.time_str}`
                  : 'Hover any hour below to inspect · Click to jump clock'}
              </span>
            </div>
          </div>
        )}

        {/* 24-Hour Engineering Timeline Matrix (Time / Carbon / Renewables / Markers) */}
        <div
          className="overflow-x-auto border border-slate-200 rounded-2xl shadow-inner"
          onMouseLeave={() => setHoveredHour(null)}
        >
          <div className="min-w-[960px]">
            {/* Row 0: Marker Row (NOW / BEST WINDOW / DEADLINE) */}
            <div
              className="grid bg-[#F1F5F9] border-b border-slate-200 text-[9px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-1.5 text-slate-500 border-r border-slate-200">
                MARKER
              </div>
              {forecast24h.map((pt) => {
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isDeadline = pt.hour === deadlineHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`marker-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-1.5 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      isNow
                        ? 'bg-[#3B82F6]/20 text-[#3B82F6] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                        : isDeadline
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold'
                        : isHovered
                        ? 'bg-emerald-100/70 text-emerald-800'
                        : 'text-transparent'
                    }`}
                  >
                    {isNow
                      ? '● NOW'
                      : isBest
                      ? '★ BEST'
                      : isDeadline
                      ? 'SLA'
                      : '·'}
                  </button>
                );
              })}
            </div>

            {/* Row 1: Hour Labels */}
            <div
              className="grid bg-slate-50 border-b border-slate-200 text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                TIME
              </div>
              {forecast24h.map((pt) => {
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`time-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      isNow
                        ? 'bg-[#3B82F6]/15 text-[#0d3f3a] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/15 text-[#10B981] font-bold'
                        : isHovered
                        ? 'bg-emerald-50 text-[#0d3f3a] font-semibold'
                        : 'text-slate-500 hover:text-[#0d3f3a] hover:bg-emerald-50/50'
                    }`}
                  >
                    {String(pt.hour).padStart(2, '0')}:00
                  </button>
                );
              })}
            </div>

            {/* Row 2: Carbon Intensity (gCO2/kWh) */}
            <div
              className="grid bg-white border-b border-slate-200 text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                CARBON
              </div>
              {forecast24h.map((pt) => {
                const c = Math.round(pt.carbon_intensity_gco2_kwh);
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                const colorClass =
                  c <= 420
                    ? 'text-[#10B981]'
                    : c >= 550
                    ? 'text-[#EF4444]'
                    : 'text-[#F59E0B]';
                return (
                  <button
                    key={`carbon-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${colorClass} ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold'
                        : isBest
                        ? 'bg-[#10B981]/15 font-bold'
                        : isHovered
                        ? 'bg-emerald-50 font-bold'
                        : 'hover:bg-emerald-50/50'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Row 3: Renewable Share (%) */}
            <div
              className="grid bg-white text-[10px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-2 text-slate-500 border-r border-slate-200">
                RENEW.
              </div>
              {forecast24h.map((pt) => {
                const r = Math.round(pt.renewable_percentage);
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isHovered = pt.hour === hoveredHour;
                return (
                  <button
                    key={`ren-${pt.hour}`}
                    onMouseEnter={() => setHoveredHour(pt.hour)}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`ga-timeline-cell py-2 text-center border-r border-slate-200/60 last:border-r-0 transition-colors ${
                      r >= 38 ? 'text-[#10B981]' : 'text-slate-500'
                    } ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold text-[#0d3f3a]'
                        : isBest
                        ? 'bg-[#10B981]/15 font-bold'
                        : isHovered
                        ? 'bg-emerald-50 font-bold'
                        : 'hover:bg-emerald-50/50'
                    }`}
                  >
                    {r}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
