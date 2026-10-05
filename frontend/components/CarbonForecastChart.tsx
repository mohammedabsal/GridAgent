import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';

interface CarbonForecastChartProps {
  forecast: GridHourlyPoint[];
  gridStatus: GridStatus;
  workloads: WorkloadJob[];
  onSelectHour: (hour: number) => void;
}

export const CarbonForecastChart: React.FC<CarbonForecastChartProps> = ({
  forecast,
  gridStatus,
  workloads,
  onSelectHour,
}) => {
  // Determine recommended execution windows from active/deferred jobs
  const deferredHours = new Set<string>();
  workloads.forEach((w) => {
    if (w.recommended_start_time && w.decision === 'DEFER') {
      deferredHours.add(w.recommended_start_time);
    }
  });

  // Enrich chart data with active workload markers
  const chartData = forecast.map((pt) => {
    const jobsAtHour = workloads.filter(
      (w) =>
        w.recommended_start_time === pt.time_str ||
        w.actual_start_time === pt.time_str
    );
    return {
      ...pt,
      scheduledJobsCount: jobsAtHour.length,
      scheduledJobIds: jobsAtHour.map((j) => j.job_id).join(', '),
    };
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white">
              24-Hour Grid Carbon Intensity &amp; Renewable Forecast
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
              Click any hour to move Sim Clock
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Displays current time ({gridStatus.current_time}), 24h carbon forecast (gCO₂/kWh), renewable generation share (%), and AI-recommended execution windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
            Now ({gridStatus.current_time})
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500/40 border border-emerald-400 inline-block" />
            Clean Execution Window (12:00–13:00, 16:00–18:00)
          </span>
        </div>
      </div>

      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined) {
                onSelectHour(state.activeTooltipIndex);
              }
            }}
          >
            <defs>
              <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="renewableGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time_str"
              stroke="#94a3b8"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              yAxisId="left"
              stroke="#f43f5e"
              tick={{ fontSize: 11 }}
              domain={[0, 800]}
              label={{
                value: 'gCO₂/kWh',
                angle: -90,
                position: 'insideLeft',
                fill: '#f43f5e',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10b981"
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
              label={{
                value: 'Renewable %',
                angle: 90,
                position: 'insideRight',
                fill: '#10b981',
                fontSize: 11,
              }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: unknown, name: string) => {
                if (name === 'Carbon Intensity') return [`${value} gCO₂/kWh`, name];
                if (name === 'Renewable Share') return [`${value}%`, name];
                return [String(value), name];
              }}
              labelFormatter={(label, payload) => {
                const pt = payload?.[0]?.payload as
                  | (GridHourlyPoint & { scheduledJobIds?: string })
                  | undefined;
                if (!pt) return `Time: ${label}`;
                const jobsNote = pt.scheduledJobIds
                  ? ` | Scheduled: ${pt.scheduledJobIds}`
                  : '';
                return `${label} — ${pt.grid_regime} ($${pt.electricity_price_usd_kwh}/kWh)${jobsNote}`;
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />

            {/* Highlight afternoon clean execution window (16:00 - 18:00) */}
            <ReferenceArea
              yAxisId="left"
              x1="16:00"
              x2="18:00"
              fill="#10b981"
              fillOpacity={0.14}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{
                value: 'Recommended Clean Window (17:00)',
                position: 'insideTop',
                fill: '#34d399',
                fontSize: 11,
              }}
            />

            {/* Highlight midday solar window (12:00 - 13:00) */}
            <ReferenceArea
              yAxisId="left"
              x1="12:00"
              x2="13:00"
              fill="#10b981"
              fillOpacity={0.08}
            />

            {/* Current simulation time vertical line */}
            <ReferenceLine
              yAxisId="left"
              x={gridStatus.current_time}
              stroke="#fbbf24"
              strokeWidth={2}
              label={{
                value: `NOW (${gridStatus.current_time})`,
                position: 'top',
                fill: '#fbbf24',
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="carbon_intensity_gco2_kwh"
              name="Carbon Intensity"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fill="url(#carbonGrad)"
            />

            <Line
              yAxisId="right"
              type="monotone"
              dataKey="renewable_percentage"
              name="Renewable Share"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#10b981' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scheduled Workload Execution Windows Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">
          Workload Execution Windows:
        </span>
        {workloads.map((w) => {
          const start = w.recommended_start_time || w.submitted_at_time;
          const durHrs = Math.max(1, Math.ceil(w.duration_minutes / 60));
          const startH = parseInt(start.split(':')[0], 10);
          const endH = (startH + durHrs) % 24;
          const endStr = `${String(endH).padStart(2, '0')}:00`;

          let badgeStyle =
            'bg-slate-800 text-slate-300 border-slate-700';
          if (w.status === 'DEFERRED') {
            badgeStyle =
              'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
          } else if (w.status === 'RUNNING') {
            badgeStyle = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
          } else if (w.status === 'BLOCKED') {
            badgeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
          } else if (w.status === 'AWAITING_APPROVAL') {
            badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
          } else if (w.status === 'COMPLETED') {
            badgeStyle = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
          }

          return (
            <div
              key={w.job_id}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 ${badgeStyle}`}
            >
              <span className="font-bold">{w.job_id}</span>
              <span>
                { w.status === 'BLOCKED'
                  ? 'BLOCKED'
                  : `${start}→${endStr}` }
              </span>
              <span className="opacity-75 text-[10px]">({w.status})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
