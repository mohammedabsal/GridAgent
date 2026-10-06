from __future__ import annotations

from fastapi.testclient import TestClient
from backend.main import app


client = TestClient(app)


def test_health_and_mcp_tools() -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert data["is_simulated"] is True

    tools_resp = client.get("/api/mcp/tools")
    assert tools_resp.status_code == 200
    tool_names = {t["name"] for t in tools_resp.json()["tools"]}
    assert "get_current_grid_status" in tool_names
    assert "get_grid_forecast" in tool_names
    assert "get_renewable_forecast" in tool_names
    assert "get_workload_queue" in tool_names
    assert "find_optimal_execution_window" in tool_names
    assert "check_execution_policy" in tool_names


def test_all_five_demo_scenarios() -> None:
    r = client.post("/api/scenarios/run-all")
    assert r.status_code == 200
    payload = r.json()
    assert payload["scenarios_executed"] == 5

    results_by_id = {
        item["scenario"]["id"]: item["result"] for item in payload["results"]
    }

    # Scenario 1: Flexible AI training job -> DEFER to 17:00, ALLOW
    s1 = results_by_id["scenario_1"]
    assert s1["job"]["job_id"] == "AI-TRAINING-001"
    assert s1["job"]["status"] == "DEFERRED"
    assert s1["job"]["recommended_start_time"] == "17:00"
    assert s1["policy"]["policy_decision"] == "ALLOW"

    # Scenario 2: Urgent production workload -> RUN_IMMEDIATELY at 15:00
    s2 = results_by_id["scenario_2"]
    assert s2["job"]["status"] == "RUNNING"
    assert s2["reasoning"]["decision"] == "RUN_IMMEDIATELY"

    # Scenario 3: Protected production service -> DENY, BLOCKED
    s3 = results_by_id["scenario_3"]
    assert s3["policy"]["policy_decision"] == "DENY"
    assert s3["job"]["status"] == "BLOCKED"
    assert s3["reasoning"]["decision"] == "BLOCKED_BY_SAFETY"

    # Scenario 4: Multi-window batch analytics -> DEFER to 17:00 (17:00-19:00 window)
    s4 = results_by_id["scenario_4"]
    assert s4["job"]["status"] == "DEFERRED"
    assert s4["job"]["recommended_start_time"] == "17:00"
    assert s4["reasoning"]["predicted_carbon_intensity"] == 405.0

    # Scenario 5: Human approval required -> ASK_USER, AWAITING_APPROVAL
    s5 = results_by_id["scenario_5"]
    assert s5["policy"]["policy_decision"] == "ASK_USER"
    assert s5["job"]["status"] == "AWAITING_APPROVAL"

    # Verify operator can approve Scenario 5 job
    approve_resp = client.post(
        "/api/workloads/MIGRATION-005/action",
        json={"action": "approve"},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["job"]["status"] == "DEFERRED"


def test_section_18_judge_lifecycle_walkthrough() -> None:
    """
    Tests the complete Section 18 lifecycle flow:
    15:00 Submit AI-TRAINING-001 -> QUEUED -> DEFERRED (17:00)
    17:00 Simulation step -> DEFERRED -> RUNNING
    18:00 Simulation step -> RUNNING -> COMPLETED
    """
    r = client.post("/api/scenarios/walkthrough")
    assert r.status_code == 200
    data = r.json()

    assert data["step_15_00_submission"]["result"]["job"]["status"] == "DEFERRED"
    assert any(
        t["job_id"] == "AI-TRAINING-001" and t["from"] == "DEFERRED" and t["to"] == "RUNNING"
        for t in data["step_17_00_start"]
    )
    assert any(
        t["job_id"] == "AI-TRAINING-001" and t["from"] == "RUNNING" and t["to"] == "COMPLETED"
        for t in data["step_18_00_complete"]
    )
    assert data["final_job"]["status"] == "COMPLETED"
    assert data["comparison"]["total_carbon_saved_gco2"] == 46500.0
    assert data["comparison"]["carbon_reduction_percentage"] == 44.29


def test_interactive_workload_configure_and_candidate_windows() -> None:
    """
    Verifies that changing a workload's deadline or duration in the Digital Twin
    recalculates candidate execution windows and AI recommendations deterministically.
    """
    client.post("/api/scenarios/scenario_1/run?reset_first=true")

    # Tighten deadline to 16:00 -> should switch AI-TRAINING-001 to RUN_IMMEDIATELY at 15:00
    tight_resp = client.post(
        "/api/workloads/AI-TRAINING-001/configure",
        json={"deadline": "16:00", "duration_minutes": 60},
    )
    assert tight_resp.status_code == 200
    tight_data = tight_resp.json()
    assert tight_data["reasoning"]["decision"] == "RUN_IMMEDIATELY"
    assert tight_data["job"]["carbon_reduction_pct"] == 0.0

    # Relax deadline back to 20:00 -> should defer to 17:00 again with candidate windows
    relax_resp = client.post(
        "/api/workloads/AI-TRAINING-001/configure",
        json={"deadline": "20:00", "duration_minutes": 60},
    )
    assert relax_resp.status_code == 200
    relax_data = relax_resp.json()
    assert relax_data["reasoning"]["decision"] == "DEFER"
    assert relax_data["job"]["recommended_start_time"] == "17:00"
    assert len(relax_data["job"]["candidate_windows"]) >= 5

