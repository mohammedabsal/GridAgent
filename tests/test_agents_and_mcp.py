from __future__ import annotations

from backend.agents.perception_agent import perception_agent
from backend.agents.reasoning_agent import reasoning_agent
from backend.agents.safety_agent import safety_agent
from backend.agents.workload_agent import workload_agent
from backend.mcp.server import mcp_registry
from backend.models.schemas import ReasoningDecisionOutput
from backend.simulation.grid_simulator import simulated_grid_provider


def test_mcp_tool_aliases_and_lifecycle_operations() -> None:
    simulated_grid_provider.reset()

    # Grid MCP aliases
    intensity = mcp_registry.call_tool("get_current_grid_intensity")["result"]
    assert intensity["carbon_intensity_gco2_kwh"] == 700.0
    assert intensity["is_simulated"] is True

    solar = mcp_registry.call_tool("get_solar_forecast")["result"]
    assert len(solar["renewable_forecast"]) == 24

    # Workload lifecycle via MCP
    job = mcp_registry.call_tool(
        "submit_workload",
        {
            "job_id": "TEST-LIFECYCLE-99",
            "name": "Video Rendering Farm",
            "workload_type": "video_rendering",
            "priority": "MEDIUM",
            "duration_minutes": 60,
            "deadline": "21:00",
            "energy_kwh": 90.0,
        },
    )["result"]
    assert job["status"] == "QUEUED"

    details = mcp_registry.call_tool("get_job_details", {"job_id": "TEST-LIFECYCLE-99"})["result"]
    assert details["found"] is True

    started = mcp_registry.call_tool("start_workload", {"job_id": "TEST-LIFECYCLE-99"})["result"]
    assert started["status"] == "RUNNING"

    paused = mcp_registry.call_tool("pause_workload", {"job_id": "TEST-LIFECYCLE-99"})["result"]
    assert paused["status"] == "PAUSED"

    resumed = mcp_registry.call_tool("resume_workload", {"job_id": "TEST-LIFECYCLE-99"})["result"]
    assert resumed["status"] == "RUNNING"

    cancelled = mcp_registry.call_tool("cancel_workload", {"job_id": "TEST-LIFECYCLE-99"})["result"]
    assert cancelled["status"] == "CANCELLED"


def test_individual_agents_and_pydantic_reasoning_output() -> None:
    simulated_grid_provider.reset()
    perception = perception_agent.perceive_grid_environment()
    assert perception["current_status"]["current_time"] == "15:00"
    assert perception["is_simulated"] is True

    submitted = mcp_registry.call_tool(
        "submit_workload",
        {
            "job_id": "PYDANTIC-CHECK-01",
            "name": "DB Index Rebuild",
            "workload_type": "database_indexing",
            "priority": "LOW",
            "duration_minutes": 60,
            "deadline": "20:00",
            "energy_kwh": 100.0,
        },
    )["result"]

    inspected = workload_agent.inspect_job("PYDANTIC-CHECK-01")
    reasoning_out = reasoning_agent.reason_schedule(
        workload=inspected["workload"],
        perception_data=perception,
    )
    assert isinstance(reasoning_out, ReasoningDecisionOutput)
    assert reasoning_out.job_id == "PYDANTIC-CHECK-01"
    assert reasoning_out.decision == "DEFER"
    assert reasoning_out.recommended_start_time == "17:00"
    assert 0.0 <= reasoning_out.confidence <= 1.0

    policy_res, validated_out = safety_agent.validate_decision(
        workload=inspected["workload"],
        reasoning_output=reasoning_out,
    )
    assert policy_res.policy_decision.value == "ALLOW"
    assert validated_out.decision == "DEFER"
