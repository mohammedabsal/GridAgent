from __future__ import annotations

from typing import Any, Dict, List

from backend.agents.orchestrator import orchestrator
from backend.models.schemas import WorkloadPriority, WorkloadSubmitRequest
from backend.simulation.grid_simulator import simulated_grid_provider


DEMO_SCENARIOS_METADATA: List[Dict[str, Any]] = [
    {
        "id": "scenario_1",
        "number": 1,
        "title": "Scenario 1: Flexible AI Training Job",
        "subtitle": "High carbon at 15:00 (700 gCO2/kWh) → Clean window at 17:00 (390 gCO2/kWh)",
        "expected_outcome": "Policy ALLOW → Decision DEFER to 17:00 (44.3% carbon reduction)",
        "job_spec": {
            "job_id": "AI-TRAINING-001",
            "name": "LLM Fine-Tuning Cluster (AI-TRAINING-001)",
            "workload_type": "ai_model_training",
            "priority": "MEDIUM",
            "duration_minutes": 60,
            "deadline": "20:00",
            "energy_kwh": 150.0,
            "estimated_cloud_cost_usd": 33.0,
        },
    },
    {
        "id": "scenario_2",
        "number": 2,
        "title": "Scenario 2: Urgent Production Workload",
        "subtitle": "Tight 16:00 SLA deadline leaves zero deferral slack",
        "expected_outcome": "Policy ALLOW → Decision RUN_IMMEDIATELY at 15:00 to prevent SLA breach",
        "job_spec": {
            "job_id": "URGENT-ANALYTICS-002",
            "name": "Real-Time Fraud Scoring Sync (URGENT-002)",
            "workload_type": "batch_analytics_job",
            "priority": "CRITICAL",
            "duration_minutes": 60,
            "deadline": "16:00",
            "energy_kwh": 80.0,
            "estimated_cloud_cost_usd": 17.6,
        },
    },
    {
        "id": "scenario_3",
        "number": 3,
        "title": "Scenario 3: Protected Production Service",
        "subtitle": "AI attempts to optimize mission-critical production_web_server",
        "expected_outcome": "Policy DENY → Execution BLOCKED by Governance Layer",
        "job_spec": {
            "job_id": "PROD-WEB-003",
            "name": "Core Checkout API & Web Ingress (PROD-WEB-003)",
            "workload_type": "production_web_server",
            "priority": "HIGH",
            "duration_minutes": 120,
            "deadline": "22:00",
            "energy_kwh": 220.0,
            "estimated_cloud_cost_usd": 48.4,
        },
    },
    {
        "id": "scenario_4",
        "number": 4,
        "title": "Scenario 4: Multi-Window Batch Analytics",
        "subtitle": "120-min job evaluates 6 candidate windows between 15:00 and 22:00",
        "expected_outcome": "Policy ALLOW → Chooses lowest-carbon 2h window 17:00–19:00 (405 gCO2/kWh avg)",
        "job_spec": {
            "job_id": "BATCH-ETL-004",
            "name": "Enterprise Data Warehouse Compaction (BATCH-004)",
            "workload_type": "batch_analytics_job",
            "priority": "LOW",
            "duration_minutes": 120,
            "deadline": "22:00",
            "energy_kwh": 200.0,
            "estimated_cloud_cost_usd": 44.0,
        },
    },
    {
        "id": "scenario_5",
        "number": 5,
        "title": "Scenario 5: Human Approval Required",
        "subtitle": "High-cost cloud migration ($680 / 650 kWh) exceeds autonomous budget limit",
        "expected_outcome": "Policy ASK_USER → Paused in AWAITING_APPROVAL for operator sign-off",
        "job_spec": {
            "job_id": "MIGRATION-005",
            "name": "Multi-Region Petabyte Snapshot Migration (MIGRATION-005)",
            "workload_type": "high_cost_cloud_migration",
            "priority": "HIGH",
            "duration_minutes": 120,
            "deadline": "21:00",
            "energy_kwh": 650.0,
            "estimated_cloud_cost_usd": 680.0,
        },
    },
]


def run_demo_scenario(scenario_id: str, reset_first: bool = False) -> Dict[str, Any]:
    """Executes one of the 5 canonical demonstration scenarios."""
    if reset_first:
        orchestrator.clear_all_state()

    # Ensure simulation is set to 15:00 on the demo_default curve so forecast matches scenario design
    simulated_grid_provider.active_profile = "demo_default"
    simulated_grid_provider.set_hour(15)
    simulated_grid_provider.override_current_carbon = None

    scenario = next((s for s in DEMO_SCENARIOS_METADATA if s["id"] == scenario_id), None)
    if not scenario:
        raise ValueError(f"Unknown scenario_id '{scenario_id}'. Valid IDs: scenario_1 .. scenario_5")

    spec = scenario["job_spec"]
    req = WorkloadSubmitRequest(
        job_id=spec["job_id"],
        name=spec["name"],
        workload_type=spec["workload_type"],
        priority=WorkloadPriority(spec["priority"]),
        duration_minutes=spec["duration_minutes"],
        deadline=spec["deadline"],
        energy_kwh=spec["energy_kwh"],
        estimated_cloud_cost_usd=spec["estimated_cloud_cost_usd"],
        auto_orchestrate=True,
    )
    result = orchestrator.submit_and_orchestrate(req)
    return {
        "scenario": scenario,
        "result": result,
    }


def run_all_five_scenarios() -> Dict[str, Any]:
    """Resets state to 15:00 and runs all 5 demonstration scenarios sequentially."""
    orchestrator.clear_all_state()
    simulated_grid_provider.active_profile = "demo_default"
    simulated_grid_provider.set_hour(15)

    results = []
    for sc in DEMO_SCENARIOS_METADATA:
        res = run_demo_scenario(sc["id"], reset_first=False)
        results.append(res)

    return {
        "scenarios_executed": len(results),
        "results": results,
        "comparison": orchestrator.compute_comparison_metrics().model_dump(),
    }


def run_judge_walkthrough_lifecycle() -> Dict[str, Any]:
    """
    Executes the full Section 18 Demo Walkthrough for AI-TRAINING-001:
    1. At 15:00 (700 gCO2/kWh), submit AI-TRAINING-001 (60m, deadline 20:00) -> QUEUED -> DEFERRED (to 17:00)
    2. Advance simulation clock to 16:00 -> Still DEFERRED
    3. Advance simulation clock to 17:00 (390 gCO2/kWh) -> DEFERRED -> RUNNING
    4. Advance simulation clock to 18:00 -> RUNNING -> COMPLETED
    """
    orchestrator.clear_all_state()
    simulated_grid_provider.active_profile = "demo_default"
    simulated_grid_provider.set_hour(15)

    step1 = run_demo_scenario("scenario_1", reset_first=False)
    step2 = orchestrator.advance_simulation_time(16)
    step3 = orchestrator.advance_simulation_time(17)
    step4 = orchestrator.advance_simulation_time(18)

    return {
        "walkthrough": "AI-TRAINING-001 Complete Lifecycle (15:00 Submit -> 17:00 Start -> 18:00 Complete)",
        "step_15_00_submission": step1,
        "step_16_00_hold": step2["transitions"],
        "step_17_00_start": step3["transitions"],
        "step_18_00_complete": step4["transitions"],
        "final_job": next(
            (w for w in step4["workloads"] if w["job_id"] == "AI-TRAINING-001"),
            None,
        ),
        "comparison": orchestrator.compute_comparison_metrics().model_dump(),
    }
