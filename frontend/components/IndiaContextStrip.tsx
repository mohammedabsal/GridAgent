import React from 'react';
import { MapPin, Sun, Factory, Scale } from 'lucide-react';
import type { DashboardState } from '../services/api';

interface Props {
  data: DashboardState;
  busy: boolean;
  onChangeProfile: (profile: string) => void;
}

const PROFILE_META: Record<
  string,
  { label: string; blurb: string; peakBadge: string; cleanBadge: string; icon: React.ReactNode }
> = {
  demo_default: {
    label: 'Balanced India Mix',
    blurb: 'Typical all-India demand curve with afternoon transient + evening wind clean window.',
    peakBadge: 'Peak 700 gCO₂/kWh',
    cleanBadge: 'Best 17:00 (390g)',
    icon: <Scale className="h-3.5 w-3.5" />,
  },
  solar_duck_curve: {
    label: 'Solar Peak Day',
    blurb: 'Karnataka / Rajasthan midday solar surge — cheapest, cleanest compute window ~13:00.',
    peakBadge: 'Peak 690 gCO₂/kWh',
    cleanBadge: 'Best 13:00 (310g)',
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  high_carbon_stress: {
    label: 'Coal-Heavy Day',
    blurb: 'Monsoon / low-wind stress day — grid leans on thermal, deferral saves the most.',
    peakBadge: 'Peak 860 gCO₂/kWh',
    cleanBadge: 'Best 13:00 (640g)',
    icon: <Factory className="h-3.5 w-3.5" />,
  },
};

export const IndiaContextStrip: React.FC<Props> = ({ data, busy, onChangeProfile }) => {
  const grid = data.grid_status;
  const solarPeak = data.forecast_24h.reduce(
    (best, pt) => (pt.solar_generation_mw > (best?.solar_generation_mw ?? -1) ? pt : best),
    data.forecast_24h[0],
  );
  const cleanestPt = data.forecast_24h.reduce(
    (best, pt) =>
      pt.carbon_intensity_gco2_kwh < (best?.carbon_intensity_gco2_kwh ?? 9999) ? pt : best,
    data.forecast_24h[0],
  );
  const savedKg = data.comparison.total_carbon_saved_gco2 / 1000;
  const phones = Math.round(savedKg * 50);

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/70 shadow-sm">
      <div className="flex flex-col gap-2.5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
            <MapPin className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                India Grid Context
              </span>
              <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700">
                GRID-INDIA Telemetry
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-mono font-semibold tabular-nums text-amber-800">
                Solar Peak {solarPeak?.time_str ?? '13:00'} ({Math.round(solarPeak?.solar_generation_mw ?? 0)} MW)
              </span>
              <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-mono font-semibold tabular-nums text-emerald-800">
                Cleanest {cleanestPt?.time_str ?? '17:00'} ({Math.round(cleanestPt?.carbon_intensity_gco2_kwh ?? 390)} gCO₂/kWh)
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-slate-600">
              Selected <strong className="font-mono tabular-nums text-[#0d3f3a]">{grid.current_time} IST</strong>:{' '}
              <strong className="font-mono tabular-nums text-[#0d3f3a]">
                {Math.round(grid.carbon_intensity_gco2_kwh)} gCO₂/kWh
              </strong>{' '}
              ({Math.round(grid.renewable_percentage)}% RE) — AI shift saves{' '}
              <strong className="font-mono tabular-nums text-emerald-700">{savedKg.toFixed(1)} kg CO₂</strong>
              <span className="hidden xl:inline text-slate-500">
                {' '}
                (≈ {phones.toLocaleString('en-IN')} phone charges · ${data.comparison.total_cost_saved_usd.toFixed(0)} saved)
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">
            Grid Preset:
          </span>
          {data.available_profiles.map((p) => {
            const meta = PROFILE_META[p] ?? {
              label: p,
              blurb: '',
              peakBadge: '',
              cleanBadge: '',
              icon: null,
            };
            const active = data.active_profile === p;
            return (
              <button
                key={p}
                title={`${meta.blurb} (${meta.peakBadge} · ${meta.cleanBadge})`}
                disabled={busy}
                onClick={() => onChangeProfile(p)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                {meta.icon}
                <span className="whitespace-nowrap">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

