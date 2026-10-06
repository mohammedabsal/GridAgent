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

export const ComposedChart: React.FC<{
  data?: HourlyDataPoint[];
  onClick?: (state: { activeTooltipIndex?: number }) => void;
  children?: React.ReactNode;
  margin?: Record<string, number>;
}> = ({ data = [], onClick }) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!data.length) return null;

  const width = 900;
  const height = 240;
  const padLeft = 44;
  const padRight = 44;
  const padTop = 24;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxCarbon = 800;

  const getX = (idx: number) =>
    padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
  const getYCarbon = (val: number) =>
    padTop + plotH - (Math.min(maxCarbon, Math.max(0, val)) / maxCarbon) * plotH;
  const getYRen = (pct: number) =>
    padTop + plotH - (Math.min(100, Math.max(0, pct)) / 100) * plotH;

  const carbonPoints = data
    .map(
      (d, i) =>
        `${getX(i).toFixed(1)},${getYCarbon(
          Number(d.carbon_intensity_gco2_kwh || 0)
        ).toFixed(1)}`
    )
    .join(' ');

  const carbonAreaPoints = `${getX(0).toFixed(1)},${(padTop + plotH).toFixed(
    1
  )} ${carbonPoints} ${getX(data.length - 1).toFixed(1)},${(
    padTop + plotH
  ).toFixed(1)}`;

  const renPoints = data
    .map(
      (d, i) =>
        `${getX(i).toFixed(1)},${getYRen(
          Number(d.renewable_percentage || 0)
        ).toFixed(1)}`
    )
    .join(' ');

  // Clean window 16:00 - 18:00 highlight
  const x16 = getX(16);
  const x18 = getX(18);

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="w-full h-full relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="svgCarbonFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.38" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid Lines */}
        {[0, 200, 400, 600, 800].map((val) => {
          const y = getYCarbon(val);
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={y + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="10"
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
          fill="#10b981"
          fillOpacity="0.14"
          stroke="#10b981"
          strokeDasharray="3 3"
        />
        <text
          x={(x16 + x18) / 2}
          y={padTop + 12}
          textAnchor="middle"
          fill="#34d399"
          fontSize="10"
          fontWeight="bold"
        >
          Clean Window (17:00)
        </text>

        {/* Carbon Intensity Area & Line */}
        <polygon points={carbonAreaPoints} fill="url(#svgCarbonFill)" />
        <polyline
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2.5"
          points={carbonPoints}
        />

        {/* Renewable Share Line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          points={renPoints}
        />

        {/* Data points & X-axis labels */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getYCarbon(Number(d.carbon_intensity_gco2_kwh || 0));
          const ry = getYRen(Number(d.renewable_percentage || 0));
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              onClick={() => onClick?.({ activeTooltipIndex: i })}
            >
              <rect
                x={cx - plotW / data.length / 2}
                y={padTop}
                width={plotW / data.length}
                height={plotH}
                fill="transparent"
              />
              <circle cx={cx} cy={cy} r={hoverIdx === i ? 5 : 2.5} fill="#f43f5e" />
              <circle cx={cx} cy={ry} r={hoverIdx === i ? 4.5 : 2} fill="#10b981" />
              {i % 2 === 0 && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {String(d.time_str || `${i}:00`)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="absolute top-2 right-3 bg-slate-950/95 border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl pointer-events-none">
          <div className="font-mono font-bold text-white">
            {String(hovered.time_str)} — {String(hovered.grid_regime || '')}
          </div>
          <div className="text-rose-300 font-mono">
            Carbon: {String(hovered.carbon_intensity_gco2_kwh)} gCO₂/kWh
          </div>
          <div className="text-emerald-300 font-mono">
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
            <div className="flex items-end gap-2 h-44 w-full justify-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-rose-300 mb-1">
                  {baseVal}kg
                </span>
                <div
                  className="w-7 sm:w-9 rounded-t-lg bg-rose-500/85 transition-all"
                  style={{ height: `${baseH}px` }}
                  title={`Baseline: ${baseVal} kgCO₂`}
                />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-mono text-emerald-300 mb-1">
                  {optVal}kg
                </span>
                <div
                  className="w-7 sm:w-9 rounded-t-lg bg-emerald-500 transition-all"
                  style={{ height: `${optH}px` }}
                  title={`Optimized: ${optVal} kgCO₂`}
                />
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-300 truncate max-w-full">
              {String(item.job_id || '')}
            </div>
          </div>
        );
      })}
    </div>
  );
};

