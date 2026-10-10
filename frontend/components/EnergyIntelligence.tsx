import React, { useMemo } from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Activity, Gauge, Sun, Wind as WindIcon } from 'lucide-react';
import { GridHourlyPoint, GridStatus } from '../services/api';
import { AnimatedNumber } from './motion';

interface EnergyIntelligenceProps {
  grid: GridStatus;
  forecast24h: GridHourlyPoint[];
  /** Recommended clean window in "HH:00" form (e.g. the reasoning agent's 17:00). */
  highlightHour?: string;
  onSelectHour: (hour: number) => void;
}

const carbonTone = (value: number) =>
  value <= 420
    ? { text: 'text-[#10B981]', hex: '#10B981', chip: 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30', label: 'CLEAN' }
    : value >= 550
    ? { text: 'text-[#EF4444]', hex: '#EF4444', chip: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30', label: 'HIGH' }
    : { text: 'text-[#F59E0B]', hex: '#F59E0B', chip: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30', label: 'MODERATE' };

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
}

const ChartTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur-md px-3 py-2 shadow-lg">
      <div className="text-xs font-mono font-bold text-[#0d3f3a]">{label}</div>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span>{entry.name}</span>
          <span className="ml-auto font-semibold text-[#0d3f3a]">
            {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const EnergyIntelligence: React.FC<EnergyIntelligenceProps> = ({
  grid,
  forecast24h,
  highlightHour,
  onSelectHour,
}) => {
  const hasData = forecast24h.length > 0;

  // The cleaner window to explain: prefer the recommended window (e.g. 17:00),
  // otherwise fall back to the cleanest hour in the next 12h (mirrors perception agent).
  const cleanPoint = useMemo(() => {
    if (!hasData) return null;
    if (highlightHour) {
      const hit = forecast24h.find((p) => p.time_str === highlightHour);
      if (hit) return hit;
    }
    const cur = grid.current_hour;
    const upcoming = Array.from(
      { length: 12 },
      (_, off) => forecast24h[(cur + off) % forecast24h.length]
    );
    return upcoming.reduce((a, b) =>
      b.carbon_intensity_gco2_kwh < a.carbon_intensity_gco2_kwh ? b : a
    );
  }, [hasData, forecast24h, highlightHour, grid.current_hour]);

  // A high-carbon hour used as a contrast to explain *why* the clean window is cleaner.
  const peakPoint = useMemo(() => {
    if (!hasData) return null;
    return forecast24h.reduce((a, b) =>
      b.carbon_intensity_gco2_kwh > a.carbon_intensity_gco2_kwh ? b : a
    );
  }, [hasData, forecast24h]);

  const yDomain = useMemo(() => {
    if (!hasData) return [0, 800] as [number, number];
    const vals = forecast24h.map((p) => p.carbon_intensity_gco2_kwh);
    return [Math.max(0, Math.round(Math.min(...vals) - 60)), Math.round(Math.max(...vals) + 60)] as [
      number,
      number
    ];
  }, [hasData, forecast24h]);

  const tone = carbonTone(grid.carbon_intensity_gco2_kwh);

  const cards = [
    {
      key: 'carbon',
      label: 'Current Carbon',
      numValue: grid.carbon_intensity_gco2_kwh,
      decimals: 0,
      unit: 'gCO₂/kWh',
      sub: grid.grid_status_label,
      Icon: Activity,
      valueClass: tone.text,
      IconClass: tone.text,
    },
    {
      key: 'renew',
      label: 'Renewable Share',
      numValue: grid.renewable_percentage,
      decimals: 1,
      unit: '%',
      sub: 'of total generation',
      Icon: Gauge,
      valueClass: 'text-[#10B981]',
      IconClass: 'text-[#10B981]',
    },
    {
      key: 'solar',
      label: 'Solar',
      numValue: grid.solar_generation_mw,
      decimals: 0,
      unit: 'MW',
      sub: grid.weather_condition,
      Icon: Sun,
      valueClass: 'text-[#F59E0B]',
      IconClass: 'text-[#F59E0B]',
    },
    {
      key: 'wind',
      label: 'Wind',
      numValue: grid.wind_generation_mw,
      decimals: 0,
      unit: 'MW',
      sub: grid.grid_regime,
      Icon: WindIcon,
      valueClass: 'text-sky-600',
      IconClass: 'text-sky-600',
    },
  ];

  const cleanCarbon = cleanPoint ? Math.round(cleanPoint.carbon_intensity_gco2_kwh) : 0;
  const reductionVsPeak =
    cleanPoint && peakPoint && peakPoint.carbon_intensity_gco2_kwh > 0
      ? Math.round(
          (1 - cleanPoint.carbon_intensity_gco2_kwh / peakPoint.carbon_intensity_gco2_kwh) * 100
        )
      : 0;

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            Grid Intelligence · 24-hour forecast
          </p>
          <h2 className="text-xl font-extrabold tracking-tight text-[#0d3f3a]">
            ENERGY INTELLIGENCE
          </h2>
          <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-[13px]">
            Modeled grid carbon intensity and renewable generation across the day — so you can see
            exactly why a given hour is a cleaner window.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono text-slate-500 shadow-sm">
            {grid.current_time} · now
          </span>
          <span
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono font-semibold shadow-sm ${tone.chip}`}
          >
            {tone.label} CARBON
          </span>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ key, label, numValue, decimals, unit, sub, Icon, valueClass, IconClass }) => (
          <div
            key={key}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ga-card-hover ga-glass-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {label}
              </span>
              <Icon className={`h-4 w-4 ${IconClass}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className={`text-2xl font-mono font-bold ${valueClass}`}>
                <AnimatedNumber value={numValue} decimals={decimals} />
              </span>
              <span className="text-xs font-mono text-slate-500">{unit}</span>
            </div>
            <div className="mt-1 truncate text-[11px] text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* Central chart */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ga-glass-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-[#0d3f3a]">
              Carbon Intensity — 24 Hours
            </h3>
            <p className="text-[11px] text-slate-500">
              gCO₂/kWh · click any hour to move the simulation clock
            </p>
          </div>
          {cleanPoint && (
            <span className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 px-3 py-1.5 text-[11px] font-mono font-bold text-[#0d3f3a]">
              {cleanPoint.time_str} — {cleanCarbon} gCO₂/kWh —{' '}
              <span className="text-[#10B981]">RECOMMENDED WINDOW</span>
            </span>
          )}
        </div>

        <div className="h-72 w-full sm:h-80">
          {hasData && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={forecast24h}
                margin={{ top: 16, right: 16, left: 0, bottom: 4 }}
                onClick={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    onSelectHour(state.activeTooltipIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="energyCarbonFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="time_str"
                  interval={1}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  yAxisId="left"
                  label={{
                    value: 'gCO₂/kWh',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 8,
                    style: { fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' },
                  }}
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'monospace' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  width={54}
                />
                <Tooltip content={<ChartTooltip />} />

                {/* Current time marker */}
                <ReferenceLine
                  yAxisId="left"
                  x={grid.current_time}
                  stroke="#F59E0B"
                  strokeDasharray="4 3"
                  label={{
                    value: `NOW ${grid.current_time}`,
                    position: 'top',

                    fill: '#F59E0B',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />


                {/* Clean window highlight */}
                {cleanPoint && (
                  <>
                    <ReferenceLine
                      yAxisId="left"
                      x={cleanPoint.time_str}
                      stroke="#10B981"
                      strokeDasharray="4 3"
                      label={{
                        value: `${cleanPoint.time_str} RECOMMENDED WINDOW`,
                        position: 'top',
                        fill: '#059669',
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    />
                    <ReferenceDot
                      yAxisId="left"
                      x={cleanPoint.time_str}
                      y={cleanPoint.carbon_intensity_gco2_kwh}
                      r={6}
                      fill="#10B981"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  </>
                )}

                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="carbon_intensity_gco2_kwh"
                  name="Carbon"
                  stroke="none"
                  fill="url(#energyCarbonFill)"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="carbon_intensity_gco2_kwh"
                  name="Carbon"
                  stroke="#0d3f3a"
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: '#0d3f3a', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>


      {/* Why section */}
      {cleanPoint && peakPoint && (
        <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight text-[#0d3f3a]">Why?</span>
            <span className="rounded-md border border-[#10B981]/30 bg-white px-2 py-0.5 text-[10px] font-mono font-bold text-[#10B981]">
              {cleanPoint.time_str} · {cleanCarbon} gCO₂/kWh
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[#0d3f3a]">
            Higher renewable availability → lower modeled carbon intensity.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Renewables at {cleanPoint.time_str}
              </div>
              <div className="mt-1 text-lg font-mono font-bold text-[#10B981]">
                {cleanPoint.renewable_percentage.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500">
                Solar {Math.round(cleanPoint.solar_generation_mw).toLocaleString()} MW + Wind{' '}
                {Math.round(cleanPoint.wind_generation_mw).toLocaleString()} MW
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Contrast · peak carbon {peakPoint.time_str}
              </div>
              <div className="mt-1 text-lg font-mono font-bold text-[#EF4444]">
                {Math.round(peakPoint.carbon_intensity_gco2_kwh)} gCO₂/kWh
              </div>
              <div className="text-[11px] text-slate-500">
                Renewables only {peakPoint.renewable_percentage.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Cleaner by
              </div>
              <div className="mt-1 text-lg font-mono font-bold text-[#0d3f3a]">
                {reductionVsPeak}%
              </div>
              <div className="text-[11px] text-slate-500">vs. the dirtiest hour today</div>
            </div>
          </div>

          {/* Data mode / provenance */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-emerald-200/60 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Data mode:
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono text-slate-600">
              {grid.is_simulated ? 'Simulated' : 'Live'}
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono text-slate-600">
              Horizon: 24h hourly
            </span>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-mono text-slate-600">
              Source: {grid.data_source}
            </span>
          </div>
        </div>
      )}
    </section>
  );
};

