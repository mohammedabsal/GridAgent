import React, { useState } from 'react';

export const ResponsiveContainer: React.FC<{
  width?: string | number;
  height?: string | number;
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="w-full h-full relative select-none">{children}</div>
);

export const CartesianGrid: React.FC<Record<string, unknown>> = () => null;
export const XAxis: React.FC<Record<string, unknown>> = () => null;
export const YAxis: React.FC<Record<string, unknown>> = () => null;
export const Tooltip: React.FC<Record<string, unknown>> = () => null;
export const Legend: React.FC<Record<string, unknown>> = () => null;
export const ReferenceArea: React.FC<Record<string, unknown>> = () => null;
export const ReferenceLine: React.FC<Record<string, unknown>> = () => null;
export const ReferenceDot: React.FC<Record<string, unknown>> = () => null;
export const Area: React.FC<Record<string, unknown>> = () => null;
export const Line: React.FC<Record<string, unknown>> = () => null;
export const Bar: React.FC<Record<string, unknown>> = () => null;

interface HourlyDataPoint {
  hour?: number;
  time_str?: string;
  carbon_intensity_gco2_kwh?: number;
  renewable_percentage?: number;
  electricity_price_usd_kwh?: number;
  grid_regime?: string;
  [key: string]: unknown;
}

/**
 * Generates a smooth monotone cubic Bezier SVG path through a list of [x, y] points.
 */
function buildSmoothCurvePath(pts: [number, number][]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = ((x0 + x1) / 2).toFixed(1);
    d += ` C ${cx} ${y0.toFixed(1)}, ${cx} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d;
}

export const ComposedChart: React.FC<{
  data?: HourlyDataPoint[];
  onClick?: (state: { activeTooltipIndex?: number }) => void;
  children?: React.ReactNode;
  margin?: Record<string, number>;
}> = ({ data = [], onClick }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data.length) return null;

  const width = 900;
  const height = 250;
  const padLeft = 46;
  const padRight = 44;
  const padTop = 26;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxCarbon = 800;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
  const getYCarbon = (val: number) =>
    padTop + plotH - (Math.min(maxCarbon, Math.max(0, val)) / maxCarbon) * plotH;
  const getYRen = (pct: number) =>
    padTop + plotH - (Math.min(100, Math.max(0, pct)) / 100) * plotH;

  const carbonPts: [number, number][] = data.map((d, i) => [
    getX(i),
    getYCarbon(Number(d.carbon_intensity_gco2_kwh || 0)),
  ]);
  const renPts: [number, number][] = data.map((d, i) => [
    getX(i),
    getYRen(Number(d.renewable_percentage || 0)),
  ]);

  const carbonSmoothPath = buildSmoothCurvePath(carbonPts);
  const carbonAreaPath = `${carbonSmoothPath} L ${getX(data.length - 1).toFixed(
    1
  )} ${(padTop + plotH).toFixed(1)} L ${getX(0).toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} Z`;

  const renSmoothPath = buildSmoothCurvePath(renPts);

  // Clean window 16:00 - 18:00 highlight
  const x16 = getX(16);
  const x18 = getX(18);
  const x17 = getX(17);
  const y17 = getYCarbon(Number(data[17]?.carbon_intensity_gco2_kwh || 390));

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="w-full h-full relative" onMouseLeave={() => setHoverIdx(null)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="svgCarbonFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.28" />
            <stop offset="52%" stopColor="#F59E0B" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="svgCleanZone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
          </linearGradient>
          <filter
            id="chartPointGlow"
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="3.5"
              floodColor="#10B981"
              floodOpacity="0.45"
            />
          </filter>
        </defs>

        {/* Horizontal Scientific Grid Lines */}
        {[0, 200, 400, 600, 800].map((val) => {
          const y = getYCarbon(val);
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3.5}
                textAnchor="end"
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Clean Execution Window Highlight (16:00 - 18:00) */}
        <rect
          x={x16}
          y={padTop}
          width={Math.max(0, x18 - x16)}
          height={plotH}
          rx="4"
          fill="url(#svgCleanZone)"
          stroke="#10B981"
          strokeOpacity="0.45"
          strokeDasharray="3 3"
        />
        <text
          x={(x16 + x18) / 2}
          y={padTop + 13}
          textAnchor="middle"
          fill="#059669"
          fontSize="9.5"
          fontFamily="monospace"
          fontWeight="bold"
        >
          ★ CLEAN WINDOW (17:00)
        </text>

        {/* Hover Vertical Cursor Line */}
        {hoverIdx !== null && (
          <line
            x1={getX(hoverIdx)}
            y1={padTop}
            x2={getX(hoverIdx)}
            y2={padTop + plotH}
            stroke="#0D3F3A"
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.55"
            pointerEvents="none"
          />
        )}

        {/* Smooth Carbon Intensity Area & Curve */}
        <path d={carbonAreaPath} fill="url(#svgCarbonFill)" pointerEvents="none" />
        <path
          d={carbonSmoothPath}
          fill="none"
          stroke="#0D3F3A"
          strokeWidth="2.4"
          strokeLinecap="round"
          pointerEvents="none"
        />

        {/* Smooth Renewable Share Curve */}
        <path
          d={renSmoothPath}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          strokeDasharray="5 3"
          strokeLinecap="round"
          pointerEvents="none"
        />

        {/* Recommended Window Reference Dot at 17:00 */}
        {data[17] && (
          <g filter="url(#chartPointGlow)" pointerEvents="none">
            <circle
              cx={x17}
              cy={y17}
              r="7"
              fill="#10B981"
              fillOpacity="0.25"
            />
            <circle
              cx={x17}
              cy={y17}
              r="4.5"
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth="1.8"
            />
          </g>
        )}

        {/* Data points & X-axis labels */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getYCarbon(Number(d.carbon_intensity_gco2_kwh || 0));
          const ry = getYRen(Number(d.renewable_percentage || 0));
          const isHovered = hoverIdx === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onClick={() => onClick?.({ activeTooltipIndex: i })}
            >
              <rect
                x={cx - plotW / data.length / 2}
                y={padTop}
                width={plotW / data.length}
                height={plotH}
                fill="transparent"
              />
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 5.5 : 2.5}
                fill={
                  Number(d.carbon_intensity_gco2_kwh || 0) <= 420
                    ? '#10B981'
                    : Number(d.carbon_intensity_gco2_kwh || 0) >= 550
                    ? '#EF4444'
                    : '#0D3F3A'
                }
                stroke={isHovered ? '#FFFFFF' : 'none'}
                strokeWidth={isHovered ? 1.8 : 0}
              />
              <circle
                cx={cx}
                cy={ry}
                r={isHovered ? 4.5 : 2}
                fill="#10B981"
              />
              {i % 2 === 0 && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fill={isHovered ? '#0D3F3A' : '#64748B'}
                  fontWeight={isHovered ? '700' : '400'}
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {String(d.time_str || `${i}:00`)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
<<<<<<< HEAD
        <div className="absolute top-2 right-3 bg-white/95 border border-slate-300 rounded-xl px-3 py-2 text-xs shadow-xl pointer-events-none">
          <div className="font-mono font-bold text-[#0d3f3a]">
            {String(hovered.time_str)} — {String(hovered.grid_regime || '')}
          </div>
          <div className="text-rose-600 font-mono">
            Carbon: {String(hovered.carbon_intensity_gco2_kwh)} gCO₂/kWh
          </div>
          <div className="text-emerald-600 font-mono">
=======
        <div className="absolute top-2 right-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs shadow-xl pointer-events-none">
          <div className="font-mono font-bold text-[#0d3f3a]">
            {String(hovered.time_str)} — {String(hovered.grid_regime || '')}
          </div>
          <div className="text-rose-600 font-mono font-semibold mt-0.5">
            Carbon: {String(hovered.carbon_intensity_gco2_kwh)} gCO₂/kWh
          </div>
          <div className="text-emerald-600 font-mono font-semibold">
>>>>>>> 6c5bb74776f15a398af4e1918fca8cc9792105f2
            Renewable: {String(hovered.renewable_percentage)}%
          </div>
        </div>
      )}
    </div>
  );
};

export const BarChart: React.FC<{
  data?: Record<string, unknown>[];
  children?: React.ReactNode;
}> = ({ data = [] }) => {
  if (!data.length) return null;

  const maxVal = Math.max(
    10,
    ...data.map((d) =>
      Math.max(
        Number(d['Baseline (Fixed Schedule) kgCO₂'] || 0),
        Number(d['GridAgent-AI (Optimized) kgCO₂'] || 0)
      )
    )
  );

  return (
    <div className="w-full h-full flex items-end justify-around gap-4 pt-6 pb-2 px-4">
      {data.map((item, idx) => {
        const baseVal = Number(item['Baseline (Fixed Schedule) kgCO₂'] || 0);
        const optVal = Number(item['GridAgent-AI (Optimized) kgCO₂'] || 0);
        const baseH = Math.max(8, Math.round((baseVal / maxVal) * 160));
        const optH = Math.max(8, Math.round((optVal / maxVal) * 160));

        return (
          <div
            key={idx}
            className="flex flex-col items-center gap-2 flex-1 max-w-[140px]"
          >
            <div className="flex items-end gap-2.5 h-44 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-rose-600 mb-1">
                  {baseVal}kg
                </span>
                <div
                  className="w-7 sm:w-9 rounded-t-lg bg-gradient-to-t from-rose-600/80 to-rose-400 border-t border-rose-300/60 transition-all duration-500 shadow-[0_0_14px_rgba(244,63,94,0.2)]"
                  style={{ height: `${baseH}px` }}
                  title={`Baseline: ${baseVal} kgCO₂`}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-emerald-600 mb-1">
                  {optVal}kg
                </span>
                <div
                  className="w-7 sm:w-9 rounded-t-lg bg-gradient-to-t from-emerald-600 to-emerald-400 border-t border-emerald-200/70 transition-all duration-500 shadow-[0_0_16px_rgba(16,185,129,0.28)]"
                  style={{ height: `${optH}px` }}
                  title={`Optimized: ${optVal} kgCO₂`}
                />
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-600 truncate max-w-full">
              {String(item.job_id || '')}
            </div>
          </div>
        );
      })}
    </div>
  );
};
