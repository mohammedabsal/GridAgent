import React, { useState } from 'react';
import { Activity, Check } from 'lucide-react';
import { GridHourlyPoint, GridStatus, WorkloadJob } from '../services/api';

interface EnergyMap24hProps {
  forecast24h: GridHourlyPoint[];
  gridStatus: GridStatus;
  selectedWorkload: WorkloadJob;
  onSelectHour: (hour: number) => void;
}

export const EnergyMap24h: React.FC<EnergyMap24hProps> = ({
  forecast24h,
  gridStatus,
  selectedWorkload,
  onSelectHour,
}) => {
  const [showCarbon, setShowCarbon] = useState(true);
  const [showRenewable, setShowRenewable] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (!forecast24h.length) return null;

  const recStart =
    selectedWorkload.recommended_start_time ||
    selectedWorkload.submitted_at_time ||
    '17:00';
  const recHour = parseInt(recStart.split(':')[0], 10);
  const recPoint = forecast24h[recHour] || forecast24h[17] || forecast24h[0];
  const nowHour = gridStatus.current_hour;
  const nowPoint =
    forecast24h[nowHour] || forecast24h[15] || forecast24h[0];

  // SVG dimensions
  const width = 860;
  const height = 225;
  const padLeft = 48;
  const padRight = 46;
  const padTop = 44;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (h: number) => padLeft + (h / 23) * plotW;
  const getYCarbon = (val: number) =>
    padTop + plotH - (Math.min(850, Math.max(100, val)) - 100) / 750 * plotH;
  const getYRen = (pct: number) =>
    padTop + plotH - (Math.min(100, Math.max(0, pct)) / 100) * plotH;
  const getYCost = (price: number) =>
    padTop + plotH - (Math.min(0.28, Math.max(0.04, price)) / 0.28) * plotH;

  // Build smooth cubic bezier SVG path
  const buildSmoothPath = (pts: [number, number][]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const cx = (x0 + x1) / 2;
      d += ` C ${cx.toFixed(1)} ${y0.toFixed(1)}, ${cx.toFixed(1)} ${y1.toFixed(
        1
      )}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return d;
  };

  const carbonPts: [number, number][] = forecast24h.map((pt, i) => [
    getX(i),
    getYCarbon(pt.carbon_intensity_gco2_kwh),
  ]);
  const renPts: [number, number][] = forecast24h.map((pt, i) => [
    getX(i),
    getYRen(pt.renewable_percentage),
  ]);
  const costPts: [number, number][] = forecast24h.map((pt, i) => [
    getX(i),
    getYCost(pt.electricity_price_usd_kwh),
  ]);

  const carbonPath = buildSmoothPath(carbonPts);
  const carbonAreaPath = `${carbonPath} L ${getX(23).toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const renPath = buildSmoothPath(renPts);
  const renAreaPath = `${renPath} L ${getX(23).toFixed(1)} ${(
    padTop + plotH
  ).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const costPath = buildSmoothPath(costPts);

  const nowX = getX(nowHour);
  const nowY = getYCarbon(nowPoint.carbon_intensity_gco2_kwh);
  const nowRenY = getYRen(nowPoint.renewable_percentage);

  const recStartX = getX(Math.max(0, recHour - 0.6));
  const recEndX = getX(Math.min(23, recHour + 1.8));
  const recCenterX = getX(recHour);
  const recY = getYCarbon(recPoint.carbon_intensity_gco2_kwh);
  const recRenY = getYRen(recPoint.renewable_percentage);

  const tickHours = [0, 3, 6, 9, 12, 15, 18, 21, 23];

  return (
    <div className="rounded-2xl border border-[#162844] bg-[#071020]/90 backdrop-blur-xl p-4 sm:p-5 shadow-2xl h-full flex flex-col justify-between">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-600" />
          <h3 className="text-sm sm:text-base font-bold text-[#0d3f3a]">
            24-Hour Energy Map{' '}
            <span className="text-xs font-normal text-slate-500">
              (Carbon Intensity, Renewable Energy &amp; Cost)
            </span>
          </h3>
        </div>

        {/* 3 Filter Legend Pills matching screenshot */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <button
            onClick={() => setShowCarbon(!showCarbon)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition ${
              showCarbon
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <span className="h-3.5 w-3.5 rounded bg-rose-500 text-slate-950 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
            Carbon Intensity
          </button>

          <button
            onClick={() => setShowRenewable(!showRenewable)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition ${
              showRenewable
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <span className="h-3.5 w-3.5 rounded bg-emerald-500 text-slate-950 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
            Renewable %
          </button>

          <button
            onClick={() => setShowCost(!showCost)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold transition ${
              showCost
                ? 'bg-sky-950/60 border-sky-500/50 text-sky-700'
                : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <span className="h-3.5 w-3.5 rounded bg-sky-500 text-slate-950 flex items-center justify-center">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
            Electricity Cost
          </button>
        </div>
      </div>

      {/* Main SVG Dual-Curve Chart with Callouts */}
      <div className="relative w-full h-52 sm:h-56">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible select-none"
        >
          <defs>
            <linearGradient id="mapCarbonGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.38" />
              <stop offset="65%" stopColor="#f43f5e" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="mapRenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="recWindowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Left Y-Axis (gCO2/kWh) */}
          {[200, 400, 600, 800].map((val) => {
            const y = getYCarbon(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#13233d"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Left Y-Axis Title */}
          <text
            x="12"
            y={padTop + plotH / 2}
            textAnchor="middle"
            fill="#64748b"
            fontSize="10"
            transform={`rotate(-90, 12, ${padTop + plotH / 2})`}
          >
            gCO₂/kWh
          </text>

          {/* Right Y-Axis (Renewable %) */}
          {[25, 50, 75, 100].map((pct) => {
            const y = getYRen(pct);
            return (
              <text
                key={pct}
                x={width - padRight + 8}
                y={y + 3.5}
                textAnchor="start"
                fill="#10b981"
                fontSize="10"
              >
                {pct}
              </text>
            );
          })}
          <text
            x={width - 8}
            y={padTop + plotH / 2}
            textAnchor="middle"
            fill="#10b981"
            fontSize="10"
            transform={`rotate(90, ${width - 8}, ${padTop + plotH / 2})`}
          >
            Renewable %
          </text>

          {/* Recommended Window Vertical Shaded Corridor */}
          <rect
            x={recStartX}
            y={padTop - 8}
            width={Math.max(36, recEndX - recStartX)}
            height={plotH + 8}
            fill="url(#recWindowGrad)"
            stroke="#10b981"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Curves */}
          {showCarbon && (
            <>
              <path d={carbonAreaPath} fill="url(#mapCarbonGrad)" />
              <path
                d={carbonPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.6"
              />
            </>
          )}

          {showRenewable && (
            <>
              <path d={renAreaPath} fill="url(#mapRenGrad)" />
              <path
                d={renPath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.4"
              />
            </>
          )}

          {showCost && (
            <path
              d={costPath}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.6"
              strokeDasharray="4 4"
              opacity="0.7"
            />
          )}

          {/* NOW Vertical Line & Dots */}
          <line
            x1={nowX}
            y1={padTop + 6}
            x2={nowX}
            y2={padTop + plotH}
            stroke="#fbbf24"
            strokeWidth="1.8"
          />
          <circle
            cx={nowX}
            cy={nowY}
            r="4.5"
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <circle
            cx={nowX}
            cy={nowRenY}
            r="4"
            fill="#10b981"
            stroke="#0f172a"
            strokeWidth="1.5"
          />

          {/* NOW Floating Callout Badge (Matches screenshot) */}
          <g
            transform={`translate(${Math.min(
              width - 180,
              Math.max(padLeft + 10, nowX - 58)
            )}, 4)`}
          >
            <rect
              x="0"
              y="0"
              width="116"
              height="40"
              rx="8"
              fill="#1f1224"
              fillOpacity="0.92"
              stroke="#f43f5e"
              strokeWidth="1.2"
            />
            <rect
              x="8"
              y="6"
              width="10"
              height="10"
              rx="2"
              fill="#f43f5e"
            />
            <text
              x="22"
              y="14.5"
              fill="#fda4af"
              fontSize="9.5"
              fontWeight="bold"
            >
              Now ({nowPoint.time_str})
            </text>
            <text
              x="8"
              y="31"
              fill="#ffffff"
              fontSize="12.5"
              fontWeight="800"
            >
              {nowPoint.carbon_intensity_gco2_kwh} gCO₂/kWh
            </text>
          </g>

          {/* RECOMMENDED WINDOW Vertical Line & Dots */}
          <line
            x1={recCenterX}
            y1={padTop + 14}
            x2={recCenterX}
            y2={padTop + plotH}
            stroke="#10b981"
            strokeWidth="2"
          />
          <circle
            cx={recCenterX}
            cy={recY}
            r="4.5"
            fill="#34d399"
            stroke="#0f172a"
            strokeWidth="1.5"
          />
          <circle
            cx={recCenterX}
            cy={recRenY}
            r="4.5"
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* RECOMMENDED WINDOW Floating Callout Badge (Matches screenshot) */}
          <g
            transform={`translate(${Math.min(
              width - 185,
              Math.max(padLeft + 135, recCenterX - 35)
            )}, 10)`}
          >
            <rect
              x="0"
              y="0"
              width="138"
              height="42"
              rx="8"
              fill="#062d24"
              fillOpacity="0.94"
              stroke="#10b981"
              strokeWidth="1.3"
            />
            <rect
              x="8"
              y="6"
              width="10"
              height="10"
              rx="2"
              fill="#10b981"
            />
            <text
              x="22"
              y="14.5"
              fill="#6ee7b7"
              fontSize="9.5"
              fontWeight="bold"
            >
              Recommended Window
            </text>
            <text
              x="8"
              y="32"
              fill="#6ee7b7"
              fontSize="13"
              fontWeight="800"
            >
              {recPoint.carbon_intensity_gco2_kwh} gCO₂/kWh
            </text>
          </g>

          {/* X-Axis Labels & Clickable Hour Columns */}
          {forecast24h.map((pt, i) => {
            const cx = getX(i);
            const showLabel = tickHours.includes(i);
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onClick={() => onSelectHour(i)}
              >
                <rect
                  x={cx - plotW / 24 / 2}
                  y={padTop}
                  width={plotW / 24}
                  height={plotH + 22}
                  fill="transparent"
                />
                {showLabel && (
                  <text
                    x={cx}
                    y={height - 6}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="10.5"
                  >
                    {i === 23 ? '24:00' : pt.time_str}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoverIdx !== null && forecast24h[hoverIdx] && (
          <div className="absolute bottom-8 left-14 bg-[#081224]/95 border border-slate-300 rounded-xl px-3 py-1.5 text-[11px] pointer-events-none flex items-center gap-3 shadow-xl">
            <span className="font-mono font-bold text-[#0d3f3a]">
              {forecast24h[hoverIdx].time_str}
            </span>
            <span className="text-rose-600 font-mono">
              {forecast24h[hoverIdx].carbon_intensity_gco2_kwh} gCO₂/kWh
            </span>
            <span className="text-emerald-600 font-mono">
              🌱 {forecast24h[hoverIdx].renewable_percentage}%
            </span>
            <span className="text-sky-600 font-mono">
              ${forecast24h[hoverIdx].electricity_price_usd_kwh.toFixed(2)}/kWh
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
