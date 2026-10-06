from __future__ import annotations

from typing import Any, Dict, List
from backend.simulation.grid_simulator import get_grid_provider


def get_current_grid_status() -> Dict[str, Any]:
    """
    MCP Tool: Returns current grid carbon intensity, renewable percentage, solar/wind generation,
    electricity price, and simulation vs live telemetry metadata.
    """
    provider = get_grid_provider()
    status = provider.get_current_status()
    return status.model_dump()


def get_current_grid_intensity() -> Dict[str, Any]:
    """
    MCP Tool Alias: Returns current grid carbon intensity (gCO2/kWh) and status summary.
    """
    return get_current_grid_status()


def get_grid_forecast(hours_ahead: int = 24) -> Dict[str, Any]:
    """
    MCP Tool: Returns the 24-hour grid carbon intensity and electricity price forecast.
    Clearly labels whether data is from SIMULATION_ENGINE or LIVE_API.
    """
    provider = get_grid_provider()
    status = provider.get_current_status()
    forecast_points = provider.get_24h_forecast()
    return {
        "current_time": status.current_time,
        "current_hour": status.current_hour,
        "data_source": status.data_source,
        "is_simulated": status.is_simulated,
        "hours_count": min(hours_ahead, len(forecast_points)),
        "forecast": [pt.model_dump() for pt in forecast_points[:hours_ahead]],
    }


def get_solar_forecast() -> Dict[str, Any]:
    """
    MCP Tool: Returns 24-hour solar and wind renewable energy forecast alongside weather regimes.
    """
    provider = get_grid_provider()
    status = provider.get_current_status()
    forecast_points = provider.get_24h_forecast()
    renewable_points: List[Dict[str, Any]] = []
    for pt in forecast_points:
        renewable_points.append(
            {
                "hour": pt.hour,
                "time_str": pt.time_str,
                "solar_generation_mw": pt.solar_generation_mw,
                "wind_generation_mw": pt.wind_generation_mw,
                "renewable_percentage": pt.renewable_percentage,
                "weather_condition": pt.weather_condition,
                "is_simulated": pt.is_simulated,
            }
        )
    return {
        "current_time": status.current_time,
        "data_source": status.data_source,
        "is_simulated": status.is_simulated,
        "renewable_forecast": renewable_points,
    }


def get_renewable_forecast() -> Dict[str, Any]:
    """MCP Tool Alias for get_solar_forecast()."""
    return get_solar_forecast()


def get_historical_grid_intensity() -> Dict[str, Any]:
    """
    MCP Tool: Returns previous 24-hour historical grid carbon intensity telemetry.
    """
    provider = get_grid_provider()
    status = provider.get_current_status()
    history_points = provider.get_historical_24h()
    return {
        "data_source": status.data_source,
        "is_simulated": status.is_simulated,
        "historical": [pt.model_dump() for pt in history_points],
    }
