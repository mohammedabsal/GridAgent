from __future__ import annotations

from datetime import datetime, timezone
import uuid
from typing import Any, Dict, List

from backend.agents.execution_agent import execution_agent
from backend.agents.perception_agent import perception_agent
from backend.agents.reasoning_agent import reasoning_agent
from backend.agents.safety_agent import safety_agent
from backend.agents.workload_agent import workload_agent
from backend.database import db_manager
from backend.mcp.server import mcp_registry
from backend.models.schemas import (
    AgentActivityEvent,
    AgentStage,
    ComparisonMetrics,
    PolicyDecisionType,
    WorkloadJob,
    WorkloadSubmitRequest,
)
from backend.simulation.cloud_runtime import cloud_runtime
from backend.simulation.grid_simulator import get_grid_provider, simulated_grid_provider


class GridAgentOrchestrator:
    """
    Autonomous Multi-Agent Orchestrator implementing:
    PERCEIVE -> REASON -> SAFETY CHECK -> EXECUTE
    """

    def __init__(self) -> None:
        self._events: List[AgentActivityEvent] = []
        self._load_events()

    def _load_events(self) -> None:
        rows = db_manager.load_agent_events(limit=150)
        for r in rows:
            try:
                self._events.append(AgentActivityEvent(**r))
            except Exception:
                continue

    def emit_event(
        self,
        stage: AgentStage,
        agent_name: str,
        title: str,
        message: str,
        job_id: str | None = None,
        level: str = "INFO",
        metadata: Dict[str, Any] | None = None,
    ) -> AgentActivityEvent:
        sim_time = get_grid_provider().get_current_status().current_time
        evt = AgentActivityEvent(
            id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            simulation_time=sim_time,
            stage=stage,
            agent_name=agent_name,
            job_id=job_id,
            title=title,
            message=message,
            level=level,
            metadata=metadata or {},
        )
        self._events.append(evt)
        if len(self._events) > 200:
            self._events = self._events[-200:]
        db_manager.save_agent_event(evt.model_dump())
        return evt

    def get_events(self, limit: int = 80) -> List[AgentActivityEvent]:
        return list(reversed(self._events[-limit:]))

    def clear_all_state(self) -> None:
        cloud_runtime.clear_all()
        db_manager.clear_agent_events()
        db_manager.clear_policy_audit_logs()
        self._events.clear()
        simulated_grid_provider.reset()

    def submit_and_orchestrate(self, req: WorkloadSubmitRequest) -> Dict[str, Any]:
        """
        Submits a new workload and runs the complete PERCEIVE -> REASON -> SAFETY CHECK -> EXECUTE pipeline.
        """
        submitted_raw = mcp_registry.call_tool(
            "submit_workload",
            {
                "job_id": req.job_id,
                "name": req.name,
                "workload_type": req.workload_type,
                "priority": req.priority.value,
                "duration_minutes": req.duration_minutes,
                "deadline": req.deadline,
                "energy_kwh": req.energy_kwh,
                "estimated_cloud_cost_usd": req.estimated_cloud_cost_usd,
            },
        )["result"]
        job_id = str(submitted_raw["job_id"])

        if not req.auto_orchestrate:
            return {
                "job": submitted_raw,
                "orchestrated": False,
            }

        return self.orchestrate_job(job_id)

    def orchestrate_job(self, job_id: str) -> Dict[str, Any]:
        """
        Executes the 4-stage multi-agent cycle for `job_id`:
        1. PERCEIVE (GridPerceptionAgent + WorkloadAgent)
        2. REASON (ReasoningAgent)
        3. SAFETY CHECK (SafetyAgent + GovernancePolicyEngine)
        4. EXECUTE (ExecutionAgent + SimulatedKubernetesAdapter)
        """
        # ------------------------------------------------------------------
        # STAGE 1: PERCEIVE (Grid + Workload)
        # ------------------------------------------------------------------
        perception_data = perception_agent.perceive_grid_environment()
        curr_status = perception_data["current_status"]

        self.emit_event(
            stage=AgentStage.PERCEIVE,
            agent_name=perception_agent.name,
            job_id=job_id,
            title="Received Grid Forecast & Telemetry",
            message=(
                f"Current time {curr_status['current_time']}: Grid carbon intensity is "
                f"{curr_status['carbon_intensity_gco2_kwh']:.0f} gCO2/kWh "
                f"(Renewables: {curr_status['renewable_percentage']:.1f}%, Solar: {curr_status['solar_generation_mw']:.0f} MW). "
                f"Cleanest upcoming window at {perception_data['cleanest_upcoming_hour']} "
                f"({perception_data['cleanest_upcoming_intensity']:.0f} gCO2/kWh)."
            ),
            level="INFO",
            metadata={
                "current_carbon": curr_status["carbon_intensity_gco2_kwh"],
                "cleanest_hour": perception_data["cleanest_upcoming_hour"],
                "data_source": curr_status["data_source"],
            },
        )

        job_inspection = workload_agent.inspect_job(job_id)
        workload = job_inspection["workload"]

        self.emit_event(
            stage=AgentStage.WORKLOAD,
            agent_name=workload_agent.name,
            job_id=job_id,
            title="Analyzed Workload Constraints",
            message=job_inspection["constraint_summary"],
            level="INFO",
            metadata={
                "workload_type": workload["workload_type"],
                "priority": workload["priority"],
                "deadline": workload["deadline"],
                "duration_minutes": workload["duration_minutes"],
            },
        )

        # ------------------------------------------------------------------
        # STAGE 2: REASON (Optimization + Explainable AI)
        # ------------------------------------------------------------------
        reasoning_output = reasoning_agent.reason_schedule(
            workload=workload,
            perception_data=perception_data,
        )

        if reasoning_output.decision == "DEFER":
            reason_title = f"Cleaner Window Detected at {reasoning_output.recommended_start_time}"
            reason_msg = (
                f"Job deadline ({reasoning_output.deadline}) allows deferring {workload['duration_minutes']}-min "
                f"workload from {curr_status['current_time']} ({reasoning_output.current_carbon_intensity:.0f} gCO2/kWh) "
                f"to {reasoning_output.recommended_start_time} ({reasoning_output.predicted_carbon_intensity:.0f} gCO2/kWh), "
                f"saving {reasoning_output.estimated_carbon_savings / 1000.0:.2f} kgCO2 (-{reasoning_output.carbon_reduction_pct:.1f}%)."
            )
        else:
            reason_title = f"Immediate Execution Selected ({curr_status['current_time']})"
            reason_msg = reasoning_output.reason

        self.emit_event(
            stage=AgentStage.REASON,
            agent_name=reasoning_agent.name,
            job_id=job_id,
            title=reason_title,
            message=reason_msg,
            level="INFO",
            metadata=reasoning_output.model_dump(exclude={"candidate_windows"}),
        )

        # ------------------------------------------------------------------
        # STAGE 3: SAFETY CHECK (Governance Policy Validation)
        # ------------------------------------------------------------------
        policy_result, validated_reasoning = safety_agent.validate_decision(
            workload=workload,
            reasoning_output=reasoning_output,
        )

        safety_level = (
            "SUCCESS"
            if policy_result.policy_decision == PolicyDecisionType.ALLOW
            else ("WARNING" if policy_result.policy_decision == PolicyDecisionType.ASK_USER else "ERROR")
        )
        self.emit_event(
            stage=AgentStage.SAFETY,
            agent_name=safety_agent.name,
            job_id=job_id,
            title=f"Policy {policy_result.policy_decision.value} ({policy_result.rule_matched})",
            message=policy_result.reason,
            level=safety_level,
            metadata=policy_result.model_dump(),
        )

        # ------------------------------------------------------------------
        # STAGE 4: EXECUTE (Cloud Runtime Action)
        # ------------------------------------------------------------------
        updated_job: WorkloadJob = execution_agent.execute_validated_decision(
            job_id=job_id,
            reasoning_output=validated_reasoning,
            policy_result=policy_result,
        )

        if updated_job.status.value == "DEFERRED":
            exec_title = f"Job Scheduled for {updated_job.recommended_start_time} (QUEUED → DEFERRED)"
            exec_msg = (
                f"Workload '{job_id}' transitioned QUEUED → DEFERRED on Simulated K8s cluster. "
                f"Will auto-start at {updated_job.recommended_start_time}."
            )
            exec_level = "SUCCESS"
        elif updated_job.status.value == "RUNNING":
            exec_title = f"Job Started Immediately at {curr_status['current_time']} (QUEUED → RUNNING)"
            exec_msg = f"Workload '{job_id}' transitioned QUEUED → RUNNING on Simulated K8s cluster."
            exec_level = "SUCCESS"
        elif updated_job.status.value == "AWAITING_APPROVAL":
            exec_title = "Execution Paused — Awaiting Human Operator Approval"
            exec_msg = (
                f"Workload '{job_id}' held in AWAITING_APPROVAL state. "
                f"Operator must approve or reject proposed {updated_job.recommended_start_time} window."
            )
            exec_level = "WARNING"
        else:
            exec_title = "Execution Blocked by Governance Policy"
            exec_msg = f"Workload '{job_id}' blocked from AI modification. Protected service remains untouched."
            exec_level = "ERROR"

        self.emit_event(
            stage=AgentStage.EXECUTE,
            agent_name=execution_agent.name,
            job_id=job_id,
            title=exec_title,
            message=exec_msg,
            level=exec_level,
            metadata={"status": updated_job.status.value, "recommended_start": updated_job.recommended_start_time},
        )

        return {
            "job": updated_job.model_dump(),
            "reasoning": validated_reasoning.model_dump(),
            "policy": policy_result.model_dump(),
            "orchestrated": True,
        }

    def approve_or_reject_job(self, job_id: str, approved: bool) -> Dict[str, Any]:
        updated_job = execution_agent.handle_human_approval(job_id=job_id, approved=approved)
        self.emit_event(
            stage=AgentStage.EXECUTE,
            agent_name=execution_agent.name,
            job_id=job_id,
            title=f"Human Operator {'Approved' if approved else 'Rejected'} Workload {job_id}",
            message=(
                f"Operator {'approved' if approved else 'rejected'} schedule for '{job_id}'. "
                f"New status: {updated_job.status.value} (Start: {updated_job.recommended_start_time})."
            ),
            level="SUCCESS" if approved else "WARNING",
            metadata={"approved": approved, "status": updated_job.status.value},
        )
        return updated_job.model_dump()

    def advance_simulation_time(self, target_hour: int) -> Dict[str, Any]:
        """
        Moves the simulation clock to `target_hour`, triggers any scheduled DEFERRED -> RUNNING
        and RUNNING -> COMPLETED workload state transitions, and logs agent events.
        """
        simulated_grid_provider.set_hour(target_hour)
        transitions = cloud_runtime.advance_clock_transitions(target_hour)
        current_status = get_grid_provider().get_current_status()

        for tr in transitions:
            self.emit_event(
                stage=AgentStage.EXECUTE,
                agent_name=execution_agent.name,
                job_id=tr["job_id"],
                title=f"Lifecycle Transition: {tr['from']} → {tr['to']} at {tr['time']}",
                message=tr["message"],
                level="SUCCESS",
                metadata=tr,
            )

        return {
            "current_status": current_status.model_dump(),
            "transitions": transitions,
            "workloads": [j.model_dump() for j in cloud_runtime.list_jobs()],
        }

    def compute_comparison_metrics(self) -> ComparisonMetrics:
        jobs = cloud_runtime.list_jobs()
        baseline_em = 0.0
        optimized_em = 0.0
        baseline_cost = 0.0
        optimized_cost = 0.0
        optimized_count = 0
        blocked_count = 0
        awaiting_count = 0
        comparisons: List[Dict[str, Any]] = []

        for j in jobs:
            b_em = float(j.baseline_emissions_gco2)
            o_em = float(j.optimized_emissions_gco2) if j.optimized_emissions_gco2 > 0 else b_em
            b_cost = float(j.baseline_cost_usd)
            o_cost = float(j.optimized_cost_usd) if j.optimized_cost_usd > 0 else b_cost

            baseline_em += b_em
            optimized_em += o_em
            baseline_cost += b_cost
            optimized_cost += o_cost

            if j.decision == "DEFER":
                optimized_count += 1
            if j.status.value == "BLOCKED":
                blocked_count += 1
            if j.status.value == "AWAITING_APPROVAL":
                awaiting_count += 1

            comparisons.append(
                {
                    "job_id": j.job_id,
                    "name": j.name,
                    "workload_type": j.workload_type,
                    "status": j.status.value,
                    "decision": j.decision or "PENDING",
                    "policy_decision": j.policy_decision or "N/A",
                    "submitted_at": j.submitted_at_time,
                    "recommended_start": j.recommended_start_time or j.submitted_at_time,
                    "deadline": j.deadline,
                    "energy_kwh": j.energy_kwh,
                    "current_carbon": j.current_carbon_intensity or 0.0,
                    "predicted_carbon": j.predicted_carbon_intensity or j.current_carbon_intensity or 0.0,
                    "baseline_emissions_gco2": round(b_em, 2),
                    "optimized_emissions_gco2": round(o_em, 2),
                    "carbon_saved_gco2": round(max(0.0, b_em - o_em), 2),
                    "carbon_reduction_pct": j.carbon_reduction_pct,
                    "baseline_cost_usd": round(b_cost, 2),
                    "optimized_cost_usd": round(o_cost, 2),
                    "cost_saved_usd": round(max(0.0, b_cost - o_cost), 2),
                    "cost_reduction_pct": j.cost_reduction_pct,
                    "reason": j.decision_reason or "",
                }
            )

        total_carbon_saved = round(max(0.0, baseline_em - optimized_em), 2)
        total_cost_saved = round(max(0.0, baseline_cost - optimized_cost), 2)
        carbon_red_pct = (
            round((total_carbon_saved / baseline_em) * 100.0, 2) if baseline_em > 0 else 0.0
        )
        cost_red_pct = (
            round((total_cost_saved / baseline_cost) * 100.0, 2) if baseline_cost > 0 else 0.0
        )

        return ComparisonMetrics(
            total_jobs_evaluated=len(jobs),
            optimized_jobs_count=optimized_count,
            blocked_jobs_count=blocked_count,
            awaiting_approval_count=awaiting_count,
            baseline_total_emissions_gco2=round(baseline_em, 2),
            optimized_total_emissions_gco2=round(optimized_em, 2),
            total_carbon_saved_gco2=total_carbon_saved,
            carbon_reduction_percentage=carbon_red_pct,
            baseline_total_cost_usd=round(baseline_cost, 2),
            optimized_total_cost_usd=round(optimized_cost, 2),
            total_cost_saved_usd=total_cost_saved,
            cost_reduction_percentage=cost_red_pct,
            job_comparisons=comparisons,
        )


orchestrator = GridAgentOrchestrator()
