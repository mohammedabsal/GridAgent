from __future__ import annotations

from typing import Any, Callable, Dict, List

from backend.mcp.grid_tools import (
    get_current_grid_intensity,
    get_current_grid_status,
    get_grid_forecast,
    get_historical_grid_intensity,
    get_renewable_forecast,
    get_solar_forecast,
)
from backend.mcp.optimization_tools import find_optimal_execution_window
from backend.mcp.safety_tools import check_execution_policy
from backend.mcp.workload_tools import (
    cancel_workload,
    defer_workload,
    get_job_details,
    get_workload_details,
    get_workload_queue,
    pause_workload,
    resume_workload,
    start_workload,
    submit_workload,
)


class MCPToolRegistry:
    """
    Model Context Protocol (MCP) Server & Tool Registry for GridAgent-AI.
    Exposes deterministic, structured tools across Grid, Workload, Optimization, Safety, and Execution domains.
    """

    def __init__(self) -> None:
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._register_defaults()

    def register(
        self,
        name: str,
        category: str,
        description: str,
        fn: Callable[..., Any],
        parameters_schema: Dict[str, Any],
    ) -> None:
        self._tools[name] = {
            "name": name,
            "category": category,
            "description": description,
            "fn": fn,
            "parameters": parameters_schema,
        }

    def _register_defaults(self) -> None:
        # 1. Grid Tools
        self.register(
            name="get_current_grid_status",
            category="Grid",
            description="Retrieves real-time/simulated grid carbon intensity (gCO2/kWh), renewable share, solar/wind MW, and price.",
            fn=get_current_grid_status,
            parameters_schema={"type": "object", "properties": {}},
        )
        self.register(
            name="get_current_grid_intensity",
            category="Grid",
            description="Alias for get_current_grid_status returning current carbon intensity and grid regime.",
            fn=get_current_grid_intensity,
            parameters_schema={"type": "object", "properties": {}},
        )
        self.register(
            name="get_grid_forecast",
            category="Grid",
            description="Retrieves the 24-hour grid carbon intensity and electricity price forecast.",
            fn=get_grid_forecast,
            parameters_schema={
                "type": "object",
                "properties": {"hours_ahead": {"type": "integer", "default": 24}},
            },
        )
        self.register(
            name="get_renewable_forecast",
            category="Grid",
            description="Retrieves the 24-hour solar and wind generation forecast and weather conditions.",
            fn=get_renewable_forecast,
            parameters_schema={"type": "object", "properties": {}},
        )
        self.register(
            name="get_solar_forecast",
            category="Grid",
            description="Alias for get_renewable_forecast returning solar/wind generation curve.",
            fn=get_solar_forecast,
            parameters_schema={"type": "object", "properties": {}},
        )
        self.register(
            name="get_historical_grid_intensity",
            category="Grid",
            description="Retrieves the past 24-hour historical grid carbon intensity telemetry.",
            fn=get_historical_grid_intensity,
            parameters_schema={"type": "object", "properties": {}},
        )

        # 2. Workload Tools
        self.register(
            name="get_workload_queue",
            category="Workload",
            description="Returns all queued, running, deferred, blocked, and completed cloud workloads.",
            fn=get_workload_queue,
            parameters_schema={"type": "object", "properties": {}},
        )
        self.register(
            name="get_workload_details",
            category="Workload",
            description="Returns full details and carbon metrics for a specific workload job_id.",
            fn=get_workload_details,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )
        self.register(
            name="get_job_details",
            category="Workload",
            description="Alias for get_workload_details(job_id).",
            fn=get_job_details,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )

        # 3. Optimization Tools
        self.register(
            name="find_optimal_execution_window",
            category="Optimization",
            description="Evaluates candidate execution windows before the job deadline to minimize carbon emissions and cost.",
            fn=find_optimal_execution_window,
            parameters_schema={
                "type": "object",
                "properties": {
                    "current_time": {"type": "string"},
                    "current_carbon_intensity": {"type": "number"},
                    "forecasted_carbon_intensity": {"type": "array"},
                    "job_duration_minutes": {"type": "integer"},
                    "job_deadline": {"type": "string"},
                    "job_energy_kwh": {"type": "number"},
                    "job_priority": {"type": "string"},
                },
                "required": [
                    "current_time",
                    "current_carbon_intensity",
                    "forecasted_carbon_intensity",
                    "job_duration_minutes",
                    "job_deadline",
                ],
            },
        )

        # 4. Safety Tools
        self.register(
            name="check_execution_policy",
            category="Safety",
            description="Validates a proposed scheduling decision against ALLOW / DENY / ASK_USER governance policies.",
            fn=check_execution_policy,
            parameters_schema={
                "type": "object",
                "properties": {
                    "job_id": {"type": "string"},
                    "workload_type": {"type": "string"},
                    "proposed_decision": {"type": "string"},
                    "priority": {"type": "string"},
                    "energy_kwh": {"type": "number"},
                    "estimated_cost_usd": {"type": "number"},
                    "duration_minutes": {"type": "integer"},
                    "recommended_start_time": {"type": "string"},
                    "deadline": {"type": "string"},
                },
                "required": ["job_id", "workload_type", "proposed_decision"],
            },
        )

        # 5. Execution Tools
        self.register(
            name="submit_workload",
            category="Execution",
            description="Submits a workload to the simulated cloud runtime queue.",
            fn=submit_workload,
            parameters_schema={
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "workload_type": {"type": "string"},
                    "priority": {"type": "string"},
                    "duration_minutes": {"type": "integer"},
                    "deadline": {"type": "string"},
                    "energy_kwh": {"type": "number"},
                },
                "required": ["name"],
            },
        )
        self.register(
            name="start_workload",
            category="Execution",
            description="Starts a workload immediately in the simulated cloud environment.",
            fn=start_workload,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )
        self.register(
            name="pause_workload",
            category="Execution",
            description="Pauses a running workload in the simulated cloud environment.",
            fn=pause_workload,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )
        self.register(
            name="resume_workload",
            category="Execution",
            description="Resumes a paused or deferred workload in the simulated cloud environment.",
            fn=resume_workload,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )
        self.register(
            name="defer_workload",
            category="Execution",
            description="Defers a workload to a recommended low-carbon start window.",
            fn=defer_workload,
            parameters_schema={
                "type": "object",
                "properties": {
                    "job_id": {"type": "string"},
                    "recommended_start_time": {"type": "string"},
                },
                "required": ["job_id", "recommended_start_time"],
            },
        )
        self.register(
            name="cancel_workload",
            category="Execution",
            description="Cancels a queued, deferred, or running workload.",
            fn=cancel_workload,
            parameters_schema={
                "type": "object",
                "properties": {"job_id": {"type": "string"}},
                "required": ["job_id"],
            },
        )

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t["name"],
                "category": t["category"],
                "description": t["description"],
                "parameters": t["parameters"],
            }
            for t in self._tools.values()
        ]

    def call_tool(self, name: str, arguments: Dict[str, Any] | None = None) -> Dict[str, Any]:
        if name not in self._tools:
            raise ValueError(f"Unknown MCP tool: '{name}'")
        fn = self._tools[name]["fn"]
        args = arguments or {}
        result = fn(**args)
        return {
            "tool": name,
            "category": self._tools[name]["category"],
            "result": result,
        }


mcp_registry = MCPToolRegistry()
