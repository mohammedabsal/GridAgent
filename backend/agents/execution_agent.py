from __future__ import annotations

from typing import Any, Dict
from backend.mcp.server import mcp_registry
from backend.models.schemas import (
    DecisionType,
    PolicyDecisionType,
    PolicyValidationResult,
    ReasoningDecisionOutput,
    WorkloadJob,
    WorkloadStatus,
)
from backend.simulation.cloud_runtime import cloud_runtime
from backend.simulation.grid_simulator import get_grid_provider


class ExecutionAgent:
    """
    5. Execution Agent (EXECUTE Layer)
    Translates validated decisions into simulated Kubernetes/cloud runtime actions.
    Strictly verifies PolicyValidationResult before executing any state transition.
    """

    name: str = "ExecutionAgent"

    def execute_validated_decision(
        self,
        job_id: str,
        reasoning_output: ReasoningDecisionOutput,
        policy_result: PolicyValidationResult,
    ) -> WorkloadJob:
        job = cloud_runtime.get_job(job_id)
        if not job:
            raise KeyError(f"Workload '{job_id}' not found in cloud runtime.")

        # Attach explainability and carbon metrics to the job record
        job.current_carbon_intensity = reasoning_output.current_carbon_intensity
        job.predicted_carbon_intensity = reasoning_output.predicted_carbon_intensity
        job.baseline_emissions_gco2 = reasoning_output.baseline_emissions_gco2
        job.optimized_emissions_gco2 = reasoning_output.optimized_emissions_gco2
        job.estimated_carbon_savings_gco2 = reasoning_output.estimated_carbon_savings
        job.carbon_reduction_pct = reasoning_output.carbon_reduction_pct
        job.baseline_cost_usd = reasoning_output.baseline_cost_usd
        job.optimized_cost_usd = reasoning_output.optimized_cost_usd
        job.estimated_cost_savings_usd = reasoning_output.estimated_cost_savings
        job.cost_reduction_pct = reasoning_output.cost_reduction_pct
        job.decision = reasoning_output.decision
        job.decision_reason = reasoning_output.reason
        job.policy_decision = policy_result.policy_decision.value
        job.policy_reason = policy_result.reason
        job.confidence = reasoning_output.confidence
        job.recommended_start_time = reasoning_output.recommended_start_time

        # Enforce Policy Gate:
        # AI decision -> Policy validation -> Allowed? -> YES: Execute | NO: Block / Ask User
        if policy_result.policy_decision == PolicyDecisionType.DENY:
            return cloud_runtime.mark_blocked(job_id, policy_result.reason)

        if policy_result.policy_decision == PolicyDecisionType.ASK_USER:
            return cloud_runtime.mark_awaiting_approval(
                job_id=job_id,
                recommended_start_time=reasoning_output.recommended_start_time,
                policy_reason=policy_result.reason,
            )

        # Policy == ALLOW
        if reasoning_output.decision == DecisionType.DEFER.value:
            mcp_registry.call_tool(
                "defer_workload",
                {
                    "job_id": job_id,
                    "recommended_start_time": reasoning_output.recommended_start_time,
                },
            )
            return cloud_runtime.get_job(job_id)  # type: ignore[return-value]

        # Otherwise RUN_IMMEDIATELY
        current_time = get_grid_provider().get_current_status().current_time
        mcp_registry.call_tool(
            "start_workload",
            {"job_id": job_id, "start_time": current_time},
        )
        return cloud_runtime.get_job(job_id)  # type: ignore[return-value]

    def handle_human_approval(self, job_id: str, approved: bool) -> WorkloadJob:
        """Handles human-in-the-loop operator sign-off for ASK_USER workloads."""
        job = cloud_runtime.get_job(job_id)
        if not job:
            raise KeyError(f"Workload '{job_id}' not found.")

        current_time = get_grid_provider().get_current_status().current_time
        if approved:
            job.policy_decision = "ALLOW (HUMAN_APPROVED)"
            if job.recommended_start_time and job.recommended_start_time != current_time:
                job.decision = DecisionType.DEFER.value
                job.decision_reason = f"[Human Operator Approved Deferral] {job.decision_reason or ''}".strip()
                return cloud_runtime.defer_job(job_id, job.recommended_start_time)
            else:
                job.decision = DecisionType.RUN_IMMEDIATELY.value
                job.decision_reason = f"[Human Operator Approved Immediate Execution] {job.decision_reason or ''}".strip()
                return cloud_runtime.start_job(job_id, current_time)
        else:
            job.policy_decision = "DENY (HUMAN_REJECTED)"
            job.decision = DecisionType.BLOCKED_BY_SAFETY.value
            job.estimated_carbon_savings_gco2 = 0.0
            job.estimated_cost_savings_usd = 0.0
            job.optimized_emissions_gco2 = job.baseline_emissions_gco2
            job.optimized_cost_usd = job.baseline_cost_usd
            return cloud_runtime.mark_blocked(
                job_id,
                "Human operator rejected the proposed schedule modification.",
            )


execution_agent = ExecutionAgent()
