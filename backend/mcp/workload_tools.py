from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from backend.models.schemas import WorkloadJob, WorkloadPriority, WorkloadStatus
from backend.simulation.cloud_runtime import cloud_runtime
from backend.simulation.grid_simulator import get_grid_provider


def get_workload_queue() -> Dict[str, Any]:
    """
    MCP Tool: Retrieves all workloads in the cloud queue along with summary counts by status.
    """
    jobs = cloud_runtime.list_jobs()
    return {
        "total_count": len(jobs),
        "queued_count": sum(1 for j in jobs if j.status == WorkloadStatus.QUEUED),
        "running_count": sum(1 for j in jobs if j.status == WorkloadStatus.RUNNING),
        "deferred_count": sum(1 for j in jobs if j.status == WorkloadStatus.DEFERRED),
        "completed_count": sum(1 for j in jobs if j.status == WorkloadStatus.COMPLETED),
        "blocked_count": sum(1 for j in jobs if j.status == WorkloadStatus.BLOCKED),
        "awaiting_approval_count": sum(1 for j in jobs if j.status == WorkloadStatus.AWAITING_APPROVAL),
        "workloads": [j.model_dump() for j in jobs],
    }


def get_workload_details(job_id: str) -> Dict[str, Any]:
    """
    MCP Tool: Retrieves detailed metadata, constraints, and carbon metrics for a specific workload.
    """
    job = cloud_runtime.get_job(job_id)
    if not job:
        return {"error": f"Workload '{job_id}' not found", "found": False}
    return {"found": True, "workload": job.model_dump()}


def get_job_details(job_id: str) -> Dict[str, Any]:
    """MCP Tool Alias for get_workload_details(job_id)."""
    return get_workload_details(job_id)


def submit_workload(
    name: str,
    workload_type: str = "ai_model_training",
    priority: str = "MEDIUM",
    duration_minutes: int = 60,
    deadline: str = "20:00",
    energy_kwh: float = 150.0,
    job_id: Optional[str] = None,
    estimated_cloud_cost_usd: Optional[float] = None,
    is_protected_service: bool = False,
) -> Dict[str, Any]:
    """
    MCP Tool: Submits a new workload into the simulated cloud runtime in QUEUED state.
    """
    grid_status = get_grid_provider().get_current_status()
    generated_id = job_id or f"JOB-{uuid.uuid4().hex[:6].upper()}"
    est_cost = (
        estimated_cloud_cost_usd
        if estimated_cloud_cost_usd is not None
        else round(energy_kwh * grid_status.electricity_price_usd_kwh, 2)
    )
    protected = is_protected_service or (
        workload_type.strip().lower()
        in {"production_web_server", "emergency_database", "health_tech_api"}
    )

    job = WorkloadJob(
        job_id=generated_id,
        name=name,
        workload_type=workload_type,
        priority=WorkloadPriority(priority.upper()),
        duration_minutes=duration_minutes,
        deadline=deadline,
        energy_kwh=energy_kwh,
        estimated_cloud_cost_usd=est_cost,
        submitted_at_time=grid_status.current_time,
        status=WorkloadStatus.QUEUED,
        current_carbon_intensity=grid_status.carbon_intensity_gco2_kwh,
        is_protected_service=protected,
    )
    saved = cloud_runtime.submit_job(job)
    return saved.model_dump()


def start_workload(job_id: str, start_time: Optional[str] = None) -> Dict[str, Any]:
    """MCP Tool: Starts or transitions a workload to RUNNING state."""
    now_str = start_time or get_grid_provider().get_current_status().current_time
    updated = cloud_runtime.start_job(job_id, now_str)
    return updated.model_dump()


def pause_workload(job_id: str) -> Dict[str, Any]:
    """MCP Tool: Pauses a running workload."""
    updated = cloud_runtime.pause_job(job_id)
    return updated.model_dump()


def resume_workload(job_id: str) -> Dict[str, Any]:
    """MCP Tool: Resumes a paused or deferred workload."""
    now_str = get_grid_provider().get_current_status().current_time
    updated = cloud_runtime.resume_job(job_id, now_str)
    return updated.model_dump()


def defer_workload(job_id: str, recommended_start_time: str) -> Dict[str, Any]:
    """MCP Tool: Defers a workload to a cleaner future carbon window."""
    updated = cloud_runtime.defer_job(job_id, recommended_start_time)
    return updated.model_dump()


def cancel_workload(job_id: str) -> Dict[str, Any]:
    """MCP Tool: Cancels a workload."""
    updated = cloud_runtime.cancel_job(job_id)
    return updated.model_dump()
