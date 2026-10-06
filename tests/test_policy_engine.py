from __future__ import annotations

import pytest
from backend.models.schemas import PolicyDecisionType
from backend.policies.policy_engine import policy_engine


@pytest.mark.parametrize(
    "protected_type",
    ["production_web_server", "emergency_database", "health_tech_api"],
)
def test_deny_protected_services(protected_type: str) -> None:
    res = policy_engine.evaluate_policy(
        job_id="PROD-01",
        workload_type=protected_type,
        proposed_decision="DEFER",
        recommended_start_time="17:00",
        deadline="22:00",
    )
    assert res.policy_decision == PolicyDecisionType.DENY
    assert res.is_blocked is True
    assert res.can_proceed_automatically is False


@pytest.mark.parametrize(
    "allowed_type",
    ["batch_analytics_job", "ai_model_training", "video_rendering"],
)
def test_allow_flexible_workloads(allowed_type: str) -> None:
    res = policy_engine.evaluate_policy(
        job_id="FLEX-01",
        workload_type=allowed_type,
        proposed_decision="DEFER",
        energy_kwh=120.0,
        estimated_cost_usd=25.0,
        duration_minutes=60,
        recommended_start_time="17:00",
        deadline="20:00",
    )
    assert res.policy_decision == PolicyDecisionType.ALLOW
    assert res.can_proceed_automatically is True
    assert res.is_blocked is False


def test_ask_user_for_high_cost_migration_or_budget_exceeded() -> None:
    res_type = policy_engine.evaluate_policy(
        job_id="MIG-01",
        workload_type="high_cost_cloud_migration",
        proposed_decision="DEFER",
        energy_kwh=200.0,
        estimated_cost_usd=100.0,
        recommended_start_time="17:00",
        deadline="21:00",
    )
    assert res_type.policy_decision == PolicyDecisionType.ASK_USER
    assert res_type.requires_human_approval is True

    res_cost = policy_engine.evaluate_policy(
        job_id="EXPENSIVE-AI-02",
        workload_type="ai_model_training",
        proposed_decision="DEFER",
        energy_kwh=650.0,
        estimated_cost_usd=750.0,
        recommended_start_time="17:00",
        deadline="21:00",
    )
    assert res_cost.policy_decision == PolicyDecisionType.ASK_USER
    assert res_cost.requires_human_approval is True
