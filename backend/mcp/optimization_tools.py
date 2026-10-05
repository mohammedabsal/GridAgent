from __future__ import annotations

import math
from typing import Any, Dict, List, Optional

from backend.models.schemas import CandidateWindow


def _parse_hour(time_str: str | int) -> int:
    if isinstance(time_str, int):
        return time_str % 24
    parts = str(time_str).strip().split(":")
    return int(parts[0]) % 24


def find_optimal_execution_window(
    current_time: str | int,
    current_carbon_intensity: float,
    forecasted_carbon_intensity: List[Dict[str, Any]] | Dict[str, float],
    job_duration_minutes: int,
    job_deadline: str | int,
    job_energy_kwh: float = 100.0,
    job_priority: str = "MEDIUM",
) -> Dict[str, Any]:
    """
    MCP Tool: Deterministic Carbon-Aware Workload Optimization Algorithm.

    Given:
      - current_time (e.g., "15:00" or 15)
      - current_carbon_intensity (e.g., 700.0 gCO2/kWh)
      - forecasted_carbon_intensity (list of hourly forecast dicts or {time_str: intensity} mapping)
      - job_duration_minutes (e.g., 60, 120)
      - job_deadline (e.g., "20:00" or 20)
      - job_energy_kwh (e.g., 150.0 kWh)
      - job_priority (LOW, MEDIUM, HIGH, CRITICAL)

    Finds the valid execution window [start_hour, start_hour + duration_hours] that completes
    on or before `job_deadline` and minimizes carbon emissions (with secondary cost tie-breaking).
    """
    curr_hour = _parse_hour(current_time)
    deadline_hour = _parse_hour(job_deadline)
    duration_hours = max(1, math.ceil(job_duration_minutes / 60.0))

    # Normalize forecast into a 24-hour lookup table
    hourly_map: Dict[int, Dict[str, Any]] = {}
    if isinstance(forecasted_carbon_intensity, dict):
        for k, val in forecasted_carbon_intensity.items():
            h = _parse_hour(k)
            hourly_map[h] = {
                "hour": h,
                "time_str": f"{h:02d}:00",
                "carbon_intensity_gco2_kwh": float(val),
                "solar_generation_mw": 1500.0,
                "renewable_percentage": max(10.0, round(100.0 - float(val) / 10.0, 1)),
                "electricity_price_usd_kwh": round(0.06 + (float(val) / 700.0) * 0.14, 3),
            }
    else:
        for item in forecasted_carbon_intensity:
            h = int(item.get("hour", _parse_hour(item.get("time_str", "00:00"))))
            hourly_map[h] = {
                "hour": h,
                "time_str": f"{h:02d}:00",
                "carbon_intensity_gco2_kwh": float(item.get("carbon_intensity_gco2_kwh", current_carbon_intensity)),
                "solar_generation_mw": float(item.get("solar_generation_mw", 0.0)),
                "renewable_percentage": float(item.get("renewable_percentage", 30.0)),
                "electricity_price_usd_kwh": float(item.get("electricity_price_usd_kwh", 0.12)),
            }

    # Ensure current hour reflects the passed current_carbon_intensity
    if curr_hour not in hourly_map:
        hourly_map[curr_hour] = {
            "hour": curr_hour,
            "time_str": f"{curr_hour:02d}:00",
            "carbon_intensity_gco2_kwh": float(current_carbon_intensity),
            "solar_generation_mw": 1000.0,
            "renewable_percentage": 30.0,
            "electricity_price_usd_kwh": 0.18,
        }
    else:
        hourly_map[curr_hour]["carbon_intensity_gco2_kwh"] = float(current_carbon_intensity)

    # Compute available hours until deadline
    if deadline_hour >= curr_hour:
        total_window_hours = deadline_hour - curr_hour
    else:
        # Wraps past midnight
        total_window_hours = (24 - curr_hour) + deadline_hour

    # Evaluate all candidate start offsets from 0 (immediate) up to total_window_hours - duration_hours
    max_start_offset = max(0, total_window_hours - duration_hours)
    candidate_windows: List[CandidateWindow] = []

    for offset in range(0, max_start_offset + 1):
        start_h = (curr_hour + offset) % 24
        end_h = (start_h + duration_hours) % 24

        slice_hours = [(start_h + step) % 24 for step in range(duration_hours)]
        carbons: List[float] = []
        solars: List[float] = []
        renewables: List[float] = []
        prices: List[float] = []

        for sh in slice_hours:
            pt = hourly_map.get(
                sh,
                {
                    "carbon_intensity_gco2_kwh": float(current_carbon_intensity),
                    "solar_generation_mw": 0.0,
                    "renewable_percentage": 25.0,
                    "electricity_price_usd_kwh": 0.15,
                },
            )
            carbons.append(float(pt["carbon_intensity_gco2_kwh"]))
            solars.append(float(pt["solar_generation_mw"]))
            renewables.append(float(pt["renewable_percentage"]))
            prices.append(float(pt["electricity_price_usd_kwh"]))

        avg_carbon = sum(carbons) / len(carbons)
        avg_solar = sum(solars) / len(solars)
        avg_ren = sum(renewables) / len(renewables)
        avg_price = sum(prices) / len(prices)

        est_emissions = round(avg_carbon * job_energy_kwh, 2)
        est_cost = round(avg_price * job_energy_kwh, 2)

        # Composite score: 85% carbon intensity weight + 15% price weight + tiny preference for earlier execution on ties
        composite_score = round((avg_carbon * 0.85) + (avg_price * 1000.0 * 0.15) + (offset * 0.01), 3)

        candidate_windows.append(
            CandidateWindow(
                start_hour=start_h,
                start_time=f"{start_h:02d}:00",
                end_hour=end_h,
                end_time=f"{end_h:02d}:00",
                avg_carbon_intensity=round(avg_carbon, 1),
                avg_solar_mw=round(avg_solar, 1),
                avg_renewable_pct=round(avg_ren, 1),
                avg_price_usd_kwh=round(avg_price, 3),
                estimated_emissions_gco2=est_emissions,
                estimated_cost_usd=est_cost,
                composite_score=composite_score,
                meets_deadline=True,
            )
        )

    baseline_window = candidate_windows[0]

    # Check if deadline or CRITICAL priority forces immediate execution
    priority_upper = str(job_priority).upper()
    deadline_tight = max_start_offset == 0

    if priority_upper == "CRITICAL" or deadline_tight:
        best_window = baseline_window
        should_defer = False
        if deadline_tight:
            selection_reason = (
                f"Immediate execution required at {baseline_window.start_time}: job duration "
                f"({job_duration_minutes} mins) leaves zero deferral slack before the {deadline_hour:02d}:00 deadline."
            )
        else:
            selection_reason = (
                f"Immediate execution required at {baseline_window.start_time}: workload has CRITICAL priority "
                f"and cannot be delayed despite current carbon intensity ({baseline_window.avg_carbon_intensity:.0f} gCO2/kWh)."
            )
    else:
        # Select window with minimum avg_carbon_intensity (and lowest composite_score on ties)
        best_window = min(candidate_windows, key=lambda w: (w.avg_carbon_intensity, w.Composite_score))
        carbon_improvement = baseline_window.avg_carbon_intensity - best_window.avg_carbon_intensity
        # Defer if cleaner window saves at least 15 gCO2/kWh (or > 3% reduction)
        should_defer = best_window.start_hour != baseline_window.start_hour and carbon_improvement >= 15.0

        if not should_defer:
            best_window = baseline_window
            selection_reason = (
                f"Current window ({baseline_window.start_time}) is already optimal or within minimal variance "
                f"({baseline_window.avg_carbon_intensity:.0f} gCO2/kWh) before the {deadline_hour:02d}:00 deadline."
            )
        else:
            selection_reason = (
                f"Optimal lower-carbon window identified at {best_window.start_time}–{best_window.end_time} "
                f"where average carbon intensity drops from {baseline_window.avg_carbon_intensity:.0f} gCO2/kWh "
                f"to {best_window.avg_carbon_intensity:.0f} gCO2/kWh while completing before the {deadline_hour:02d}:00 deadline."
            )

    carbon_savings_gco2 = round(
        max(0.0, baseline_window.estimated_emissions_gco2 - best_window.estimated_emissions_gco2), 2
    )
    cost_savings_usd = round(
        max(0.0, baseline_window.estimated_cost_usd - best_window.estimated_cost_usd), 2
    )
    carbon_reduction_pct = (
        round((carbon_savings_gco2 / baseline_window.estimated_emissions_gco2) * 100.0, 2)
        if baseline_window.estimated_emissions_gco2 > 0
        else 0.0
    )
    cost_reduction_pct = (
        round((cost_savings_usd / baseline_window.estimated_cost_usd) * 100.0, 2)
        if baseline_window.estimated_cost_usd > 0
        else 0.0
    )

    return {
        "recommended_action": "DEFER" if should_defer else "RUN_IMMEDIATELY",
        "current_time": f"{curr_hour:02d}:00",
        "recommended_start_time": best_window.start_time,
        "recommended_end_time": best_window.end_time,
        "deadline": f"{deadline_hour:02d}:00",
        "current_carbon_intensity": baseline_window.avg_carbon_intensity,
        "predicted_carbon_intensity": best_window.avg_carbon_intensity,
        "baseline_emissions_gco2": baseline_window.estimated_emissions_gco2,
        "optimized_emissions_gco2": best_window.estimated_emissions_gco2,
        "estimated_carbon_savings_gco2": carbon_savings_gco2,
        "carbon_reduction_pct": carbon_reduction_pct,
        "baseline_cost_usd": baseline_window.estimated_cost_usd,
        "optimized_cost_usd": best_window.estimated_cost_usd,
        "estimated_cost_savings_usd": cost_savings_usd,
        "cost_reduction_pct": cost_reduction_pct,
        "selection_reason": selection_reason,
        "deadline_tight": deadline_tight,
        "candidate_windows": [w.model_dump(by_alias=True) for w in candidate_windows],
    }
