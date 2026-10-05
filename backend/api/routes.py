from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.agents.orchestrator import orchestrator
from backend.config import settings
from backend.database import db_manager
from backend.mcp.server import mcp_registry
from backend.models.schemas import SimulationUpdateRequest, WorkloadSubmitRequest
from backend.policies.policy_engine import policy_engine
from backend.simulation.cloud_runtime import cloud_runtime
from backend.simulation.demo_scenarios import (
    DEMO_SCENARIOS_METADATA,
    run_all_five_scenarios,
    run_demo_scenario,
    run_judge_walkthrough_lifecycle,
)
from backend.simulation.grid_simulator import PROFILES, get_grid_provider, simulated_grid_provider

router = APIRouter(prefix="/api")


class WorkloadActionRequest(BaseModel):
    action: str  # start, pause, resume, defer, cancel, approve, reject
    recommended_start_time: Optional[str] = None


class MCPToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = {}


@router.get("/health")
def health_check() -> Dict[str, Any]:
    provider = get_grid_provider()
    status = provider.get_current_status()
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "grid_data_provider": status.data_source,
        "is_simulated": status.is_simulated,
        "cloud_runtime_provider": settings.cloud_runtime_provider,
        "gemini_configured": bool(settings.gemini_api_key),
        "gemini_model": settings.gemini_model,
        "current_simulation_time": status.current_time,
    }


@router.get("/dashboard")
def get_dashboard_state() -> Dict[str, Any]:
    """Consolidated state endpoint powering the GridAgent-AI web dashboard."""
    provider = get_grid_provider()
    current_status = provider.get_current_status()
    forecast = provider.get_24h_forecast()
    historical = provider.get_historical_24h()
    workloads = [j.model_dump() for j in cloud_runtime.list_jobs()]
    events = [e.model_dump() for e in orchestrator.get_events(limit=80)]
    comparison = orchestrator.compute_comparison_metrics().model_dump()
    policy_rules = policy_engine.get_policy_rules_summary()
    policy_audit = db_manager.get_policy_audit_logs(limit=40)

    return {
        "grid_status": current_status.model_dump(),
        "forecast_24h": [pt.model_dump() for pt in forecast],
        "historical_24h": [pt.model_dump() for pt in historical],
        "available_profiles": list(PROFILES.keys()),
        "active_profile": simulated_grid_provider.active_profile,
        "workloads": workloads,
        "agent_events": events,
        "comparison": comparison,
        "policy_rules": policy_rules,
        "policy_audit_logs": policy_audit,
        "demo_scenarios": DEMO_SCENARIOS_METADATA,
        "mcp_tools": mcp_registry.list_tools(),
    }


@router.get("/grid/status")
def api_grid_status() -> Dict[str, Any]:
    return mcp_registry.call_tool("get_current_grid_status")["result"]


@router.get("/grid/forecast")
def api_grid_forecast() -> Dict[str, Any]:
    return mcp_registry.call_tool("get_grid_forecast")["result"]


@router.get("/grid/renewable")
def api_grid_renewable() -> Dict[str, Any]:
    return mcp_registry.call_tool("get_renewable_forecast")["result"]


@router.post("/simulation/update")
def api_update_simulation(req: SimulationUpdateRequest) -> Dict[str, Any]:
    if req.profile and req.profile in PROFILES:
        simulated_grid_provider.active_profile = req.profile
    if req.override_current_carbon is not None:
        simulated_grid_provider.override_current_carbon = req.override_current_carbon
    elif req.override_current_carbon is None and req.profile is not None:
        simulated_grid_provider.override_current_carbon = None

    if req.override_current_solar_mw is not None:
        simulated_grid_provider.override_current_solar_mw = req.override_current_solar_mw
    if req.cloud_capacity_utilization_pct is not None:
        simulated_grid_provider.cloud_capacity_utilization_pct = req.cloud_capacity_utilization_pct

    if req.current_hour is not None:
        return orchestrator.advance_simulation_time(req.current_hour)

    return {
        "current_status": get_grid_provider().get_current_status().model_dump(),
        "transitions": [],
        "workloads": [j.model_dump() for j in cloud_runtime.list_jobs()],
    }


@router.post("/simulation/step")
def api_step_simulation(hours: int = 1) -> Dict[str, Any]:
    target_hour = (simulated_grid_provider.current_hour + hours) % 24
    return orchestrator.advance_simulation_time(target_hour)


@router.post("/simulation/reset")
def api_reset_simulation(seed_scenario_1: bool = False) -> Dict[str, Any]:
    orchestrator.clear_all_state()
    if seed_scenario_1:
        run_demo_scenario("scenario_1", reset_first=False)
    return get_dashboard_state()


@router.get("/workloads")
def api_list_workloads() -> Dict[str, Any]:
    return mcp_registry.call_tool("get_workload_queue")["result"]


@router.post("/workloads")
def api_submit_workload(req: WorkloadSubmitRequest) -> Dict[str, Any]:
    return orchestrator.submit_and_orchestrate(req)


@router.post("/workloads/{job_id}/orchestrate")
def api_orchestrate_workload(job_id: str) -> Dict[str, Any]:
    try:
        return orchestrator.orchestrate_job(job_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/workloads/{job_id}/action")
def api_workload_action(job_id: str, req: WorkloadActionRequest) -> Dict[str, Any]:
    action = req.action.strip().lower()
    try:
        if action == "approve":
            return {"job": orchestrator.approve_or_reject_job(job_id, approved=True)}
        if action == "reject":
            return {"job": orchestrator.approve_or_reject_job(job_id, approved=False)}
        if action == "start":
            res = mcp_registry.call_tool("start_workload", {"job_id": job_id})["result"]
            return {"job": res}
        if action == "pause":
            res = mcp_registry.call_tool("pause_workload", {"job_id": job_id})["result"]
            return {"job": res}
        if action == "resume":
            res = mcp_registry.call_tool("resume_workload", {"job_id": job_id})["result"]
            return {"job": res}
        if action == "defer":
            start_t = req.recommended_start_time or "17:00"
            res = mcp_registry.call_tool(
                "defer_workload", {"job_id": job_id, "recommended_start_time": start_t}
            )["result"]
            return {"job": res}
        if action == "cancel":
            res = mcp_registry.call_tool("cancel_workload", {"job_id": job_id})["result"]
            return {"job": res}
        raise HTTPException(status_code=400, detail=f"Unsupported action: '{action}'")
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/scenarios")
def api_list_scenarios() -> Dict[str, Any]:
    return {"scenarios": DEMO_SCENARIOS_METADATA}


@router.post("/scenarios/run-all")
def api_run_all_scenarios() -> Dict[str, Any]:
    return run_all_five_scenarios()


@router.post("/scenarios/walkthrough")
def api_run_walkthrough() -> Dict[str, Any]:
    return run_judge_walkthrough_lifecycle()


@router.post("/scenarios/{scenario_id}/run")
def api_run_single_scenario(scenario_id: str, reset_first: bool = False) -> Dict[str, Any]:
    try:
        return run_demo_scenario(scenario_id, reset_first=reset_first)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/comparison")
def api_get_comparison() -> Dict[str, Any]:
    return orchestrator.compute_comparison_metrics().model_dump()


@router.get("/policies")
def api_get_policies() -> Dict[str, Any]:
    return {
        "rules": policy_engine.get_policy_rules_summary(),
        "audit_logs": db_manager.get_policy_audit_logs(limit=50),
    }


@router.get("/mcp/tools")
def api_list_mcp_tools() -> Dict[str, Any]:
    return {"tools": mcp_registry.list_tools()}


@router.post("/mcp/call")
def api_call_mcp_tool(req: MCPToolCallRequest) -> Dict[str, Any]:
    try:
        return mcp_registry.call_tool(req.tool_name, req.arguments)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
