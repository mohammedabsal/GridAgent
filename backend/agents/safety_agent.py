from __future__ import annotations

from typing import Any, Dict
from backend.mcp.server import mcp_registry
from backend.models.schemas import (
    DecisionType,
    PolicyDecisionType,
    PolicyValidationResult,
    ReasoningDecisionOutput,
)


class SafetyAgent:
    """
    4. Safety / Governance Agent (SAFETY CHECK Layer)
    Validates every AI reasoning decision against the GovernancePolicyEngine (ALLOW, DENY, ASK_USER).
    Guarantees that the AI agent NEVER overrides a DENY policy.
    """

    name: str = "SafetyAgent"

    def validate_decision(
        self,
        workload: Dict[str, Any],
        reasoning_output: ReasoningDecisionOutput,
    ) -> tuple[PolicyValidationResult, ReasoningDecisionOutput]:
        raw_result = mcp_registry.call_tool(
            "check_execution_policy",
            {
                "job_id": workload["job_id"],
                "workload_type": workload["workload_type"],
                "proposed_decision": reasoning_output.decision,
                "priority": workload["priority"],
                "energy_kwh": float(workload["energy_kwh"]),
                "estimated_cost_usd": float(workload.get("estimated_cloud_cost_usd", 0.0)),
                "duration_minutes": int(workload["duration_minutes"]),
                "recommended_start_time": reasoning_output.recommended_start_time,
                "deadline": reasoning_output.deadline,
                "is_protected_service": bool(workload.get("is_protected_service", False)),
            },
        )["result"]

        policy_result = PolicyValidationResult(**raw_result)

        # Enforce hard safety gate on the ReasoningDecisionOutput
        if policy_result.policy_decision == PolicyDecisionType.DENY:
            reasoning_output.decision = DecisionType.BLOCKED_BY_SAFETY.value
            reasoning_output.recommended_start_time = str(workload.get("submitted_at_time", "15:00"))
            reasoning_output.predicted_carbon_intensity = reasoning_output.current_carbon_intensity
            reasoning_output.estimated_carbon_savings = 0.0
            reasoning_output.estimated_cost_savings = 0.0
            reasoning_output.carbon_reduction_pct = 0.0
            reasoning_output.cost_reduction_pct = 0.0
            reasoning_output.optimized_emissions_gco2 = reasoning_output.baseline_emissions_gco2
            reasoning_output.optimized_cost_usd = reasoning_output.baseline_cost_usd
            reasoning_output.reason = policy_result.reason

        elif policy_result.policy_decision == PolicyDecisionType.ASK_USER:
            reasoning_output.decision = DecisionType.ASK_USER.value
            reasoning_output.reason = f"{policy_result.reason} Proposed optimization: {reasoning_output.reason}"

        return policy_result, reasoning_output


safety_agent = SafetyAgent()
