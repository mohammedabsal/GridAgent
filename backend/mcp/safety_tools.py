from __future__ import annotations

from typing import Any, Dict
from backend.policies.policy_engine import policy_engine


def check_execution_policy(
    job_id: str,
    workload_type: str,
    proposed_decision: str,
    priority: str = "MEDIUM",
    energy_kwh: float = 100.0,
    estimated_cost_usd: float = 0.0,
    duration_minutes: int = 60,
    recommended_start_time: str = "15:00",
    deadline: str = "20:00",
    is_protected_service: bool = False,
) -> Dict[str, Any]:
    """
    MCP Tool: Validates a proposed AI scheduling action against the Safety & Governance Policy Engine.
    Returns ALLOW, DENY, or ASK_USER along with the matched rule and explanation.
    """
    result = policy_engine.evaluate_policy(
        job_id=job_id,
        workload_type=workload_type,
        proposed_decision=proposed_decision,
        priority=priority,
        energy_kwh=energy_kwh,
        estimated_cost_usd=estimated_cost_usd,
        duration_minutes=duration_minutes,
        recommended_start_time=recommended_start_time,
        deadline=deadline,
        is_protected_service=is_protected_service,
    )
    return result.model_dump()
