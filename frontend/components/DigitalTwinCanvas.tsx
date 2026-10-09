import React from 'react';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';

interface DigitalTwinCanvasProps {
  grid: GridStatus;
  forecast24h: GridHourlyPoint[];
  workload: WorkloadJob;
  onSelectHour: (hour: number) => void;
  demoStep?: number | null;
}

export const DigitalTwinCanvas: React.FC<DigitalTwinCanvasProps> = ({
  grid,
  forecast24h,
  workload,
  onSelectHour,
  demoStep,
}) => {
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
  const submitHour = parseInt(
    (workload.submitted_at_time || '15:00').split(':')[0],
    10
  );

  const isExecutingAtCurrentHour =
    workload.status === 'RUNNING' ||
    (workload.decision === 'DEFER' && currentHour === recHour) ||
    (workload.decision === 'RUN_NOW' && currentHour === submitHour);

  const isDeferredWaiting =
    workload.decision === 'DEFER' && currentHour < recHour;

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

  // Compute node visualization (12 nodes: 2 rows of 6)
  const activeNodesCount = isExecutingAtCurrentHour
    ? 10
    : Math.max(3, Math.round((grid.cloud_capacity_utilization_pct / 100) * 12));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* =====================================================================
          HEADER BAR: DIGITAL TWIN STATUS & REAL-TO-TWIN SYNCHRONIZATION
      ===================================================================== */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold tracking-[0.14em] uppercase text-[#0d3f3a]">
            DIGITAL TWIN
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-2xl bg-white border border-slate-200 text-[11px] font-mono text-[#10B981]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            LIVE SIMULATION
          </span>
          <span className="hidden md:inline-block text-[11px] text-slate-500 border-l border-slate-200 pl-3">
            DIGITAL REPRESENTATION — Synchronized with simulated grid + workload
            data
          </span>
        </div>

        {/* Subtle Real System -> Digital Twin Mapping */}
        <div className="hidden xl:flex items-center gap-4 text-[11px] font-mono text-slate-500">
          <span>
            Cloud workload <span className="text-[#3B82F6]">→</span> Simulated
            workload
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Energy grid <span className="text-[#3B82F6]">→</span> Simulated grid
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Renewable energy <span className="text-[#3B82F6]">→</span> Forecast
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Execution <span className="text-[#3B82F6]">→</span> What-if
            simulation
          </span>
        </div>
      </div>

      {/* =====================================================================
          MAIN DIGITAL TWIN ENGINEERING SCHEMATIC CANVAS
      ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
        {/* LEFT COLUMN (3 cols): REAL SYSTEM VS DIGITAL TWIN MODEL + TELEMETRY */}
        <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-200 p-5 flex flex-col justify-between bg-slate-50">
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
                  className="text-[11px] font-mono px-1.5 py-0.5 rounded-2xl border"
                  style={{
                    color: gridStateColor,
                    borderColor: `${gridStateColor}40`,
                    backgroundColor: `${gridStateColor}12`,
                  }}
                >
                  {gridStateText}
                </span>
              </div>
            </div>

            {/* Real System -> Digital Twin Mapping Table */}
            <div className="pt-3 border-t border-slate-200">
              <div className="grid grid-cols-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200/70">
                <span>REAL SYSTEM</span>
                <span>DIGITAL TWIN</span>
              </div>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Cloud workload</span>
                  <span className="font-mono text-[#0d3f3a]">
                    {workload.job_id}
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Energy grid</span>
                  <span className="font-mono text-[#0d3f3a]">
                    {Math.round(carbon)} gCO₂/kWh
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Renewable energy</span>
                  <span className="font-mono text-[#10B981]">
                    {renewable.toFixed(1)}% ({Math.round(solarMw + windMw)} MW)
                  </span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Execution</span>
                  <span className="font-mono text-[#3B82F6]">
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

          {/* Active Workload Spec Readout */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
              TARGET WORKLOAD MODEL
            </div>
            <div className="text-sm font-semibold text-[#0d3f3a]">
              {workload.name}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
              <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-2xl">
                <div className="text-slate-500 text-[10px]">ENERGY DRAW</div>
                <div className="text-[#0d3f3a] font-semibold">
                  {workload.energy_kwh} kWh
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-2xl">
                <div className="text-slate-500 text-[10px]">SLA DEADLINE</div>
                <div className="text-[#0d3f3a] font-semibold">
                  {workload.deadline}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER/RIGHT COLUMN (9 cols): TECHNICAL CAD / TOPOLOGY VISUALIZATION */}
        <div className="lg:col-span-9 p-4 md:p-6 bg-[#F1F5F9] relative flex flex-col justify-center">
          {/* Subtle technical blueprint grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(to right, #E2E8F0 1px, transparent 1px), linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          {/* SVG Technical Schematic: SOLAR -> ENERGY GRID -> DATA CENTER -> WORKLOAD */}
          <div className="relative z-10 w-full">
            <svg
              viewBox="0 0 880 390"
              className="w-full h-auto max-h-[390px] select-none"
              role="img"
              aria-label="Digital Twin Infrastructure Topology: Solar and Wind Generation to Energy Grid to Data Center to Workload"
            >
              <defs>
                <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.08" />
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
              </defs>

              {/* =============================================================
                  STAGE 1 (TOP): RENEWABLE GENERATION (SOLAR + WIND)
              ============================================================= */}
              <g transform="translate(290, 12)">
                <rect
                  x="0"
                  y="0"
                  width="300"
                  height="64"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke={renewable >= 35 ? '#10B981' : '#CBD5E1'}
                  strokeWidth="1.2"
                />
                {/* Technical Corner Ticks */}
                <path
                  d="M 0 8 L 0 0 L 8 0 M 292 0 L 300 0 L 300 8"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  fill="none"
                />

                {/* Solar Schematic Icon */}
                <g transform="translate(18, 16)">
                  <circle
                    cx="16"
                    cy="16"
                    r="8"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.5"
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
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {renewable.toFixed(1)}% Renewable
                </text>
                <text
                  x="205"
                  y="46"
                  fill="#10B981"
                  fontSize="12"
                  fontFamily="monospace"
                >
                  {Math.round(solarMw)} MW PV
                </text>
              </g>

              {/* Flow Line 1: SOLAR -> ENERGY GRID */}
              <g>
                <line
                  x1="440"
                  y1="76"
                  x2="440"
                  y2="108"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <line
                  x1="440"
                  y1="76"
                  x2="440"
                  y2="104"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  className={`ga-flow ${renewable >= 50 ? 'ga-flow-fast' : ''}`}
                  markerEnd="url(#arrow-green)"
                />
                <circle r="3.5" fill="#10B981" className="ga-node-live">
                  <animateMotion dur={renewable >= 50 ? '0.9s' : '1.4s'} repeatCount="indefinite" path="M 440 76 L 440 104" />
                </circle>
              </g>

              {/* =============================================================
                  STAGE 2: ENERGY GRID SUBSTATION
              ============================================================= */}
              <g transform="translate(290, 110)">
                <rect
                  x="0"
                  y="0"
                  width="300"
                  height="68"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke={gridStateColor}
                  strokeWidth="1.3"
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
                  fontWeight="600"
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

              {/* Flow Line 2: ENERGY GRID -> DATA CENTER */}
              <g>
                <line
                  x1="440"
                  y1="178"
                  x2="440"
                  y2="210"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <line
                  x1="440"
                  y1="178"
                  x2="440"
                  y2="206"
                  stroke={gridStateColor}
                  strokeWidth="2.5"
                  className={`ga-flow ${isHighCarbon ? 'ga-flow-fast' : ''}`}
                  markerEnd="url(#arrow-state)"
                />
                <circle r="3.5" fill={gridStateColor} className="ga-node-live">
                  <animateMotion dur={isHighCarbon ? '0.8s' : '1.2s'} repeatCount="indefinite" path="M 440 178 L 440 206" />
                </circle>
              </g>

              {/* =============================================================
                  STAGE 3: DATA CENTER INFRASTRUCTURE (ISOMETRIC / CAD CLUSTER)
              ============================================================= */}
              <g transform="translate(230, 212)">
                <rect
                  x="0"
                  y="0"
                  width="420"
                  height="104"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke="#3B82F6"
                  strokeWidth="1.2"
                />
                <text
                  x="20"
                  y="22"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                  letterSpacing="1.2"
                >
                  DATA CENTER
                </text>
                <text
                  x="400"
                  y="22"
                  textAnchor="end"
                  fill="#0F172A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Power {workload.energy_kwh} kWh · Load{' '}
                  {Math.round(grid.cloud_capacity_utilization_pct)}%
                </text>

                {/* 2 Rows of 6 Compute Nodes (▣ ▣ ▣ ▣ ▣ ▣) */}
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
                      ? '#10B98118'
                      : '#3B82F618'
                    : '#F1F5F9';

                  return (
                    <g key={idx} transform={`translate(${nx}, ${ny})`}>
                      <rect
                        x="0"
                        y="0"
                        width="52"
                        height="22"
                        rx="2"
                        fill={nodeFill}
                        stroke={nodeStroke}
                        strokeWidth="1"
                      />
                      <rect
                        x="5"
                        y="5"
                        width="6"
                        height="12"
                        fill={
                          isNodeActive
                            ? isCleanCarbon
                              ? '#10B981'
                              : '#3B82F6'
                            : '#CBD5E1'
                        }
                      />
                      <text
                        x="16"
                        y="14"
                        fill={isNodeActive ? '#0F172A' : '#64748B'}
                        fontSize="9"
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
                  y2="344"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                />
                <line
                  x1="440"
                  y1="316"
                  x2="440"
                  y2="340"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#3B82F6'}
                  strokeWidth="2.5"
                  strokeDasharray={isExecutingAtCurrentHour ? undefined : '2 4'}
                  className={isExecutingAtCurrentHour ? 'ga-flow ga-flow-fast' : 'ga-flow-paused'}
                  markerEnd={
                    isExecutingAtCurrentHour
                      ? 'url(#arrow-green)'
                      : 'url(#arrow-blue)'
                  }
                />
                {isExecutingAtCurrentHour && (
                  <circle r="3.5" fill="#10B981" className="ga-node-live">
                    <animateMotion dur="0.9s" repeatCount="indefinite" path="M 440 316 L 440 340" />
                  </circle>
                )}
              </g>

              {/* =============================================================
                  STAGE 4 (BOTTOM): WORKLOAD EXECUTION TARGET
              ============================================================= */}
              <g transform="translate(260, 344)">
                <rect
                  x="0"
                  y="0"
                  width="360"
                  height="38"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke={isExecutingAtCurrentHour ? '#10B981' : '#CBD5E1'}
                  strokeWidth="1.2"
                />
                <circle
                  cx="18"
                  cy="19"
                  r="4"
                  fill={
                    isExecutingAtCurrentHour
                      ? '#10B981'
                      : isDeferredWaiting
                      ? '#F59E0B'
                      : '#3B82F6'
                  }
                />
                <text
                  x="32"
                  y="23"
                  fill="#0F172A"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="monospace"
                >
                  {workload.name.toUpperCase()}
                </text>
                <text
                  x="344"
                  y="23"
                  textAnchor="end"
                  fill={isExecutingAtCurrentHour ? '#10B981' : '#64748B'}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {isExecutingAtCurrentHour
                    ? `EXECUTING (${grid.current_time})`
                    : `SCHEDULED ${recStartStr}`}
                </text>
              </g>

              {/* =============================================================
                  LEFT CALLOUT: CURRENT TIME VS RECOMMENDED SCHEDULE SHIFT
              ============================================================= */}
              <g transform="translate(16, 118)">
                <rect
                  x="0"
                  y="0"
                  width="185"
                  height="88"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
                <text
                  x="12"
                  y="20"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                  letterSpacing="1"
                >
                  SCHEDULE VECTOR
                </text>
                <text
                  x="12"
                  y="42"
                  fill="#0F172A"
                  fontSize="12"
                  fontFamily="monospace"
                >
                  {workload.submitted_at_time || '15:00'} → {recStartStr}
                </text>
                <text
                  x="12"
                  y="62"
                  fill="#10B981"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  -{workload.carbon_reduction_pct.toFixed(1)}% Carbon
                </text>
                <text
                  x="12"
                  y="78"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Deadline: {workload.deadline}
                </text>
              </g>

              {/* =============================================================
                  RIGHT CALLOUT: SYSTEM TELEMETRY SUMMARY
              ============================================================= */}
              <g transform="translate(678, 118)">
                <rect
                  x="0"
                  y="0"
                  width="186"
                  height="88"
                  rx="3"
                  fill="#FFFFFF" filter="url(#cardShadow)"
                  stroke="#CBD5E1"
                  strokeWidth="1"
                />
                <text
                  x="12"
                  y="20"
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                  letterSpacing="1"
                >
                  GRID TELEMETRY
                </text>
                <text
                  x="12"
                  y="42"
                  fill="#0F172A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Solar: {Math.round(solarMw)} MW
                </text>
                <text
                  x="12"
                  y="60"
                  fill="#0F172A"
                  fontSize="11"
                  fontFamily="monospace"
                >
                  Wind: {Math.round(windMw)} MW
                </text>
                <text
                  x="12"
                  y="78"
                  fill="#64748B"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  Demand: {Math.round(grid.demand_mw)} MW
                </text>
              </g>
            </svg>
          </div>

          {/* Demo Step Banner inside Canvas if Live Demo is active */}
          {demoStep && (
            <div className="mt-2 px-4 py-2 bg-slate-50 border border-[#10B981]/50 rounded-2xl flex items-center justify-between text-xs font-mono">
              <span className="text-[#10B981] font-semibold">
                LIVE DEMO STEP {demoStep} / 6
              </span>
              <span className="text-[#0d3f3a]">
                {demoStep === 1 &&
                  'Step 1: Observing current time 15:00 — Grid carbon at 700 gCO₂/kWh — Workload Ready'}
                {demoStep === 2 &&
                  'Step 2: Digital Twin simulating execution windows 15:00, 16:00, 17:00, 18:00, 19:00...'}
                {demoStep === 3 &&
                  'Step 3: Evaluating Carbon, Cost, Deadline, and Execution Governance...'}
                {demoStep === 4 &&
                  `Step 4: Decision locked — ${recStartStr} selected as cleanest safe window`}
                {demoStep === 5 &&
                  `Step 5: Moving workload execution to ${recStartStr} on Digital Twin timeline...`}
                {demoStep === 6 &&
                  `Step 6: Carbon reduced from ${(
                    workload.baseline_emissions_gco2 / 1000
                  ).toFixed(1)} kg to ${(
                    workload.optimized_emissions_gco2 / 1000
                  ).toFixed(
                    1
                  )} kg CO₂ — Same workload. Same deadline. Cleaner energy.`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          INTERACTIVE TIME SIMULATION TIMELINE (SECTION 7)
      ===================================================================== */}
      <div className="p-5 bg-white overflow-x-auto">
        <div className="min-w-[720px] space-y-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#0d3f3a]">
              TIME SIMULATION TIMELINE
            </span>
            <span className="text-xs text-slate-500">
              Drag or select any hour to inspect grid carbon, renewables, and
              workload state
            </span>
          </div>

          {/* Legend Markers: NOW, BEST WINDOW, DEADLINE */}
          <div className="flex items-center gap-5 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#0d3f3a]">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
              NOW ({grid.current_time})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#10B981]">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              BEST WINDOW ({recStartStr})
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#F59E0B]">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
              DEADLINE ({deadlineStr})
            </span>
          </div>
        </div>

        {/* Continuous Range Slider for smooth scrubbing */}
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
            className="w-full h-1.5 bg-slate-200 rounded-2xl appearance-none cursor-pointer accent-[#10B981]"
          />
          <span className="text-[11px] font-mono text-slate-500 w-12 text-right">
            23:00
          </span>
        </div>

        {/* 24-Hour Engineering Timeline Matrix (Time / Carbon / Renewables / Markers) */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <div className="min-w-[960px]">
            {/* Row 0: Marker Row (NOW / BEST WINDOW / DEADLINE) */}
            <div
              className="grid bg-slate-50 border-b border-slate-200 text-[9px] font-mono"
              style={{ gridTemplateColumns: '76px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="px-2 py-1.5 text-slate-500 border-r border-slate-200">
                MARKER
              </div>
              {forecast24h.map((pt) => {
                const isNow = pt.hour === currentHour;
                const isBest = pt.hour === recHour;
                const isDeadline = pt.hour === deadlineHour;
                return (
                  <button
                    key={`marker-${pt.hour}`}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`py-1.5 text-center border-r border-slate-200/50 last:border-r-0 transition ${
                      isNow
                        ? 'bg-[#3B82F6]/20 text-[#3B82F6] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/20 text-[#10B981] font-bold'
                        : isDeadline
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] font-bold'
                        : 'text-transparent'
                    }`}
                  >
                    {isNow ? '● NOW' : isBest ? '★ BEST' : isDeadline ? 'SLA' : '.'}
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
                return (
                  <button
                    key={`time-${pt.hour}`}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`py-2 text-center border-r border-slate-200/50 last:border-r-0 transition ${
                      isNow
                        ? 'bg-[#3B82F6]/15 text-[#0d3f3a] font-bold'
                        : isBest
                        ? 'bg-[#10B981]/10 text-[#10B981] font-semibold'
                        : 'text-slate-500 hover:text-[#0d3f3a] hover:bg-slate-100'
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
                const colorClass =
                  c <= 420
                    ? 'text-[#10B981]'
                    : c >= 550
                    ? 'text-[#EF4444]'
                    : 'text-[#F59E0B]';
                return (
                  <button
                    key={`carbon-${pt.hour}`}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`py-2 text-center border-r border-slate-200/50 last:border-r-0 transition ${colorClass} ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold'
                        : isBest
                        ? 'bg-[#10B981]/10 font-bold'
                        : 'hover:bg-slate-100'
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
                return (
                  <button
                    key={`ren-${pt.hour}`}
                    onClick={() => onSelectHour(pt.hour)}
                    className={`py-2 text-center border-r border-slate-200/50 last:border-r-0 transition ${
                      r >= 38 ? 'text-[#10B981]' : 'text-slate-500'
                    } ${
                      isNow
                        ? 'bg-[#3B82F6]/15 font-bold text-[#0d3f3a]'
                        : isBest
                        ? 'bg-[#10B981]/10 font-bold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    {r}%
                  </button>
                );
              })}
            </div>
          </div>
        </div>{/* /min-w timeline scroll wrapper */}
        </div>
      </div>
    </div>
  );
};
