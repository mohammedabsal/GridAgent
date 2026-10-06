from __future__ import annotations

from typing import Any, Dict
from backend.mcp.server import mcp_registry


class GridPerceptionAgent:
    """
    1. Grid Perception Agent (PERCEIVE Layer)
    Collects current grid carbon intensity, 24-hour forecast, and renewable/solar generation via MCP tools.
    """

    name: str = "GridPerceptionAgent"

    def perceive_grid_environment(self) -> Dict[str, Any]:
        current_status = mcp_registry.call_tool("get_current_grid_status")["result"]
        grid_forecast = mcp_registry.call_tool("get_grid_forecast", {"hours_ahead": 24})["result"]
        renewable_forecast = mcp_registry.call_tool("get_renewable_forecast")["result"]

        # Identify lowest carbon hour in the next 12 hours for quick perception summary
        curr_hour = int(current_status["current_hour"])
        forecast_points = grid_forecast["forecast"]
        upcoming_12h = [
            forecast_points[(curr_hour + offset) % 24] for offset in range(0, 12)
        ]
        cleanest_pt = min(upcoming_12h, key=lambda p: float(p["carbon_intensity_gco2_kwh"]))

        return {
            "current_status": current_status,
            "forecast": forecast_points,
            "renewable_forecast": renewable_forecast["renewable_forecast"],
            "cleanest_upcoming_hour": cleanest_pt["time_str"],
            "cleanest_upcoming_intensity": cleanest_pt["carbon_intensity_gco2_kwh"],
            "data_source": current_status["data_source"],
            "is_simulated": current_status["is_simulated"],
        }


perception_agent = GridPerceptionAgent()
