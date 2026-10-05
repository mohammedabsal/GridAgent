from __future__ import annotations

from backend.mcp.optimization_tools import find_optimal_execution_window


def test_section_6_prompt_canonical_example() -> None:
    """
    Tests the exact optimization scenario from Section 6 of the specification:
    Current time = 15:00, Current carbon intensity = 700 gCO2/kWh
    Forecast:
      16:00 -> 450
      17:00 -> 390
      18:00 -> 420
      19:00 -> 650
    Job: Duration = 60 minutes, Deadline = 20:00
    Expected recommendation: 17:00 (390 gCO2/kWh)
    """
    forecast_map = {
        "15:00": 700.0,
        "16:00": 450.0,
        "17:00": 390.0,
        "18:00": 420.0,
        "19:00": 650.0,
        "20:00": 690.0,
    }
    res = find_optimal_execution_window(
        current_time="15:00",
        current_carbon_intensity=700.0,
        forecasted_carbon_intensity=forecast_map,
        job_duration_minutes=60,
        job_deadline="20:00",
        job_energy_kwh=150.0,
        job_priority="MEDIUM",
    )
    assert res["recommended_action"] == "DEFER"
    assert res["recommended_start_time"] == "17:00"
    assert res["predicted_carbon_intensity"] == 390.0
    assert res["current_carbon_intensity"] == 700.0
    assert res["estimated_carbon_savings_gco2"] == (700.0 - 390.0) * 150.0


def test_deadline_constraint_forces_immediate_execution() -> None:
    """
    If delaying a job would cause a deadline violation (e.g., current_time=15:00,
    duration=60m, deadline=16:00), the optimizer must recommend 15:00 (RUN_IMMEDIATELY)
    even when cleaner windows exist later at 17:00.
    """
    forecast_map = {
        "15:00": 700.0,
        "16:00": 450.0,
        "17:00": 390.0,
    }
    res = find_optimal_execution_window(
        current_time="15:00",
        current_carbon_intensity=700.0,
        forecasted_carbon_intensity=forecast_map,
        job_duration_minutes=60,
        job_deadline="16:00",
        job_energy_kwh=100.0,
        job_priority="HIGH",
    )
    assert res["recommended_action"] == "RUN_IMMEDIATELY"
    assert res["recommended_start_time"] == "15:00"
    assert res["deadline_tight"] is True


def test_multi_hour_batch_analytics_window() -> None:
    """
    For a 120-minute (2-hour) job with deadline 22:00 at 15:00,
    17:00-19:00 has average (390 + 420)/2 = 405.0 gCO2/kWh, which beats all other 2-hour windows.
    """
    forecast_map = {
        "15:00": 700.0,
        "16:00": 450.0,
        "17:00": 390.0,
        "18:00": 420.0,
        "19:00": 650.0,
        "20:00": 690.0,
        "21:00": 720.0,
    }
    res = find_optimal_execution_window(
        current_time="15:00",
        current_carbon_intensity=700.0,
        forecasted_carbon_intensity=forecast_map,
        job_duration_minutes=120,
        job_deadline="22:00",
        job_energy_kwh=200.0,
        job_priority="LOW",
    )
    assert res["recommended_action"] == "DEFER"
    assert res["recommended_start_time"] == "17:00"
    assert res["recommended_end_time"] == "19:00"
    assert res["predicted_carbon_intensity"] == 405.0
