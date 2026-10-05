from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Set

from backend.config import settings
from backend.database import db_manager
from backend.models.schemas import PolicyDecisionType, PolicyValidationResult


class GovernancePolicyEngine:
    """
    Deterministic Safety & Governance Layer enforcing ALLOW / DENY / ASK_USER policies.
    - The AI agent can NEVER override a DENY policy.
    - Every scheduling or execution action is validated before execution and logged to the audit trail.
    """

    DENY_WORKLOAD_TYPES: Set[str] = {
        "production_web_server",
        "emergency_database",
        "health_tech_api",
    }

    ASK_USER_WORKLOAD_TYPES: Set[str] = {
        "high_cost_cloud_migration",
    }

    ALLOW_WORKLOAD_TYPES: Set[str] = {
        "batch_analytics_job",
        "batch_analytics",
        "ai_model_training",
        "video_rendering",
        "database_indexing",
        "large_data_processing",
    }

    def __init__(self) -> None:
        self.cost_limit_usd: float = settings.safety_cost_limit_usd
        self.energy_limit_kwh: float = settings.safety_energy_limit_kwh
        self.min_deadline_slack_minutes: int = settings.safety_min_deadline_slack_minutes

    def evaluate_policy(
        self,
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
    ) -> PolicyValidationResult:
        now_iso = datetime.now(timezone.utc).isoformat()
        wtype = workload_type.strip().lower()

        # 1. HARD DENY: Protected production / mission-critical services
        if wtype in self.DENY_WORKLOAD_TYPES or is_protected_service:
            result = PolicyValidationResult(
                job_id=job_id,
                workload_type=workload_type,
                proposed_decision=proposed_decision,
                policy_decision=PolicyDecisionType.DENY,
                rule_matched=f"DENY_PROTECTED_WORKLOAD ({wtype})",
                reason=(
                    f"SAFETY BLOCK: Workload '{job_id}' ({wtype}) is a mission-critical protected service. "
                    f"Autonomous deferral or modification by AI agents is strictly prohibited by governance policy."
                ),
                can_proceed_automatically=False,
                requires_human_approval=False,
                is_blocked=True,
                timestamp=now_iso,
            )
            self._audit_log(result)
            return result

        # 2. ASK_USER: High-cost cloud migration workload type
        if wtype in self.ASK_USER_WORKLOAD_TYPES:
            result = PolicyValidationResult(
                job_id=job_id,
                workload_type=workload_type,
                proposed_decision=proposed_decision,
                policy_decision=PolicyDecisionType.ASK_USER,
                rule_matched=f"ASK_USER_SENSITIVE_TYPE ({wtype})",
                reason=(
                    f"HUMAN APPROVAL REQUIRED: Workload '{job_id}' ({wtype}) is classified as a high-impact "
                    f"cloud operation. Proposed schedule ({recommended_start_time}) requires operator sign-off."
                ),
                can_proceed_automatically=False,
                requires_human_approval=True,
                is_blocked=False,
                timestamp=now_iso,
            )
            self._audit_log(result)
            return result

        # 3. ASK_USER: Workloads exceeding configured cost or energy limits
        if estimated_cost_usd > self.cost_limit_usd or energy_kwh > self.energy_limit_kwh:
            result = PolicyValidationResult(
                job_id=job_id,
                workload_type=workload_type,
                proposed_decision=proposed_decision,
                policy_decision=PolicyDecisionType.ASK_USER,
                rule_matched="ASK_USER_RESOURCE_THRESHOLD_EXCEEDED",
                reason=(
                    f"HUMAN APPROVAL REQUIRED: Workload '{job_id}' exceeds governance budget thresholds "
                    f"(Energy: {energy_kwh:.1f} kWh vs {self.energy_limit_kwh:.1f} kWh limit; "
                    f"Est. Cost: ${estimated_cost_usd:.2f} vs ${self.cost_limit_usd:.2f} limit)."
                ),
                can_proceed_automatically=False,
                requires_human_approval=True,
                is_blocked=False,
                timestamp=now_iso,
            )
            self._audit_log(result)
            return result

        # 4. Check deadline safety on DEFER proposals
        if proposed_decision == "DEFER":
            slack_minutes = self._calculate_slack_minutes(
                recommended_start_time=recommended_start_time,
                duration_minutes=duration_minutes,
                deadline=deadline,
            )
            if slack_minutes < 0:
                result = PolicyValidationResult(
                    job_id=job_id,
                    workload_type=workload_type,
                    proposed_decision=proposed_decision,
                    policy_decision=PolicyDecisionType.DENY,
                    rule_matched="DENY_DEADLINE_VIOLATION",
                    reason=(
                        f"SAFETY BLOCK: Deferring '{job_id}' to {recommended_start_time} ({duration_minutes}m duration) "
                        f"would violate the {deadline} SLA deadline by {abs(slack_minutes)} minutes."
                    ),
                    can_proceed_automatically=False,
                    requires_human_approval=False,
                    is_blocked=True,
                    timestamp=now_iso,
                )
                self._audit_log(result)
                return result
            elif slack_minutes < self.min_deadline_slack_minutes:
                result = PolicyValidationResult(
                    job_id=job_id,
                    workload_type=workload_type,
                    proposed_decision=proposed_decision,
                    policy_decision=PolicyDecisionType.ASK_USER,
                    rule_matched="ASK_USER_TIGHT_DEADLINE_SLACK",
                    reason=(
                        f"HUMAN APPROVAL REQUIRED: Deferring '{job_id}' to {recommended_start_time} leaves only "
                        f"{slack_minutes} minutes of slack before the {deadline} deadline."
                    ),
                    can_proceed_automatically=False,
                    requires_human_approval=True,
                    is_blocked=False,
                    timestamp=now_iso,
                )
                self._audit_log(result)
                return result

        # 5. ALLOW: Flexible workloads in ALLOW list (or standard batch workloads)
        rule_name = f"ALLOW_FLEXIBLE_WORKLOAD ({wtype})" if wtype in self.ALLOW_WORKLOAD_TYPES else "ALLOW_DEFAULT_BATCH"
        result = PolicyValidationResult(
            job_id=job_id,
            workload_type=workload_type,
            proposed_decision=proposed_decision,
            policy_decision=PolicyDecisionType.ALLOW,
            rule_matched=rule_name,
            reason=(
                f"POLICY ALLOW: Workload '{job_id}' ({wtype}) is authorized for autonomous carbon-aware "
                f"orchestration ({proposed_decision} @ {recommended_start_time}). All SLA and cost guardrails satisfied."
            ),
            can_proceed_automatically=True,
            requires_human_approval=False,
            is_blocked=False,
            timestamp=now_iso,
        )
        self._audit_log(result)
        return result

    @staticmethod
    def _calculate_slack_minutes(recommended_start_time: str, duration_minutes: int, deadline: str) -> int:
        try:
            start_h, start_m = [int(x) for x in recommended_start_time.split(":")]
            dead_h, dead_m = [int(x) for x in deadline.split(":")]
            start_total = start_h * 60 + start_m
            dead_total = dead_h * 60 + dead_m
            if dead_total < start_total:
                dead_total += 24 * 60
            end_total = start_total + duration_minutes
            return dead_total - end_total
        except Exception:
            return 60

    @staticmethod
    def _audit_log(result: PolicyValidationResult) -> None:
        db_manager.log_policy_audit(
            {
                "timestamp": result.timestamp,
                "job_id": result.job_id,
                "workload_type": result.workload_type,
                "proposed_decision": result.proposed_decision,
                "policy_decision": result.policy_decision.value,
                "rule_matched": result.rule_matched,
                "reason": result.reason,
            }
        )

    def get_policy_rules_summary(self) -> Dict[str, List[str]]:
        return {
            "DENY": sorted(self.DENY_WORKLOAD_TYPES),
            "ALLOW": sorted(self.ALLOW_WORKLOAD_TYPES),
            "ASK_USER": sorted(self.ASK_USER_WORKLOAD_TYPES)
            + [
                f"estimated_cost_usd > ${self.cost_limit_usd:.0f}",
                f"energy_kwh > {self.energy_limit_kwh:.0f} kWh",
                f"deadline_slack < {self.min_deadline_slack_minutes} minutes",
            ],
        }


policy_engine = GovernancePolicyEngine()
