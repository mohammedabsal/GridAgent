import React from 'react';
import { MapPin, Sun, Factory, Scale } from 'lucide-react';
import type { DashboardState } from '../services/api';

interface Props {
  data: DashboardState;
  busy: boolean;
  onChangeProfile: (profile: string) => void;
}

const PROFILE_META: Record<string, { label: string; blurb: string; icon: React.ReactNode }> = {
  demo_default: {
    label: 'Balanced India Mix',
    blurb: 'Typical all-India demand curve with afternoon transient + evening wind clean window.',
    icon: <Scale className="h-3.5 w-3.5" />,
  },
  solar_duck_curve: {
    label: 'Solar Peak Day',
    blurb: 'Karnataka / Rajasthan midday solar surge — cheapest, cleanest compute window ~13:00.',
    icon: <Sun className="h-3.5 w-3.5" />,
  },
  high_carbon_stress: {
    label: 'Coal-Heavy Day',
    blurb: 'Monsoon / low-wind stress day — grid leans on thermal, deferral saves the most.',
    icon: <Factory className="h-3.5 w-3.5" />,
  },
};

export const IndiaContextStrip: React.FC<Props> = ({ data, busy, onChangeProfile }) => {
  const grid = data.grid_status;
  const solarPeak = data.forecast_24h.reduce((best, pt) =>
    pt.solar_generation_mw > (best?.solar_generation_mw ?? -1) ? pt : best, data.forecast_24h[0]);
  const savedKg = data.comparison.total_carbon_saved_gco2 / 1000;
  const phones = Math.round(savedKg * 50); // ~20 gCO₂ per full phone charge → 50 charges per kg
  const trees = (savedKg / 21).toFixed(1); // ~21 kg CO₂ absorbed per tree per year

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-amber-50 shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
            <MapPin className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">India Grid Context</span>
              <span className="rounded-full bg-emerald-600/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-700">Sustainable &amp; Resilient India 2026</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
              India&apos;s data-centre power demand is set to <strong className="text-[#0d3f3a]">3× by 2030</strong>.
              Solar peaks <strong className="text-[#0d3f3a]">~{solarPeak?.time_str ?? '13:00'} ({Math.round(solarPeak?.solar_generation_mw ?? 0)} MW)</strong> while
              right now the grid is <strong className="text-[#0d3f3a]">{Math.round(grid.carbon_intensity_gco2_kwh)} gCO₂/kWh</strong> —
              GridAgent-AI shifts flexible AI training into the clean window, currently saving{' '}
              <strong className="font-mono text-emerald-700">{savedKg.toFixed(1)} kg CO₂</strong>
              <span className="text-slate-500"> (≈ {phones.toLocaleString('en-IN')} phone charges · {trees} trees/yr · ${data.comparison.total_cost_saved_usd.toFixed(0)} saved)</span>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Grid day:</span>
          {data.available_profiles.map((p) => {
            const meta = PROFILE_META[p] ?? { label: p, blurb: '', icon: null };
            const active = data.active_profile === p;
            return (
              <button
                key={p}
                title={meta.blurb || p}
                disabled={busy || active}
                onClick={() => onChangeProfile(p)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition disabled:cursor-default ${
                  active
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                }`}
              >
                {meta.icon}
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
